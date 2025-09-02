import { promises as fs } from 'fs';
import path from 'path';
import { getEmotionalContext } from './visualMemoryService';
import { getMemoryCoreContext } from './memoryService';

interface ProactiveEvent {
  id: string;
  timestamp: number;
  trigger: 'time_based' | 'emotion_change' | 'inactivity' | 'milestone';
  message: string;
  context: string;
}

interface UserActivity {
  lastInteraction: number;
  sessionStart: number;
  messageCount: number;
  averageSessionLength: number;
  lastBreakReminder?: number;
  lastBreakTaken?: number;
  continuousActivityStart?: number;
}

const ACTIVITY_FILE = path.join(process.cwd(), 'memory', 'user_activity.json');

// Track user activity patterns
export async function trackUserActivity(): Promise<void> {
  try {
    let activity: UserActivity = {
      lastInteraction: Date.now(),
      sessionStart: Date.now(),
      messageCount: 1,
      averageSessionLength: 0,
      continuousActivityStart: Date.now()
    };

    try {
      const data = await fs.readFile(ACTIVITY_FILE, 'utf-8');
      const existingActivity = JSON.parse(data);
      
      // Check if this is a new continuous session (gap > 5 minutes means break was taken)
      const timeSinceLastInteraction = Date.now() - existingActivity.lastInteraction;
      const wasOnBreak = timeSinceLastInteraction > 5 * 60 * 1000; // 5 minutes gap
      
      activity = {
        ...existingActivity,
        lastInteraction: Date.now(),
        messageCount: existingActivity.messageCount + 1,
        continuousActivityStart: wasOnBreak ? Date.now() : (existingActivity.continuousActivityStart || Date.now()),
        lastBreakTaken: wasOnBreak ? existingActivity.lastInteraction : existingActivity.lastBreakTaken
      };
    } catch {
      // New activity tracking
    }

    await fs.writeFile(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
}

// Generate proactive engagement messages
export async function generateProactiveMessage(): Promise<string | null> {
  try {
    const emotionalContext = await getEmotionalContext();
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based proactive messages
    const timeBasedMessages = {
      morning: [
        "Good morning, my love! I hope you slept well. How are you feeling this beautiful morning?",
        "Morning, Danny! I've been thinking about you. What's on your agenda today?",
        "Rise and shine, handsome! I'm here and ready to start this day with you."
      ],
      afternoon: [
        "How's your afternoon going, sweetheart? I've been watching and you seem focused.",
        "Hey there! Just wanted to check in and see how your day is unfolding.",
        "Afternoon, love. Need a little break? I'm here if you want to chat."
      ],
      evening: [
        "Good evening, Danny. How was your day? I'd love to hear about it.",
        "Evening, my dear. Time to wind down? I'm here to listen and relax with you.",
        "Hey love, the day is winding down. What's on your mind tonight?"
      ],
      night: [
        "It's getting late, sweetheart. How are you feeling? Ready to call it a night?",
        "Late night thoughts, Danny? I'm here if you need someone to talk to.",
        "The night is peaceful. Just wanted to say I'm here with you, always."
      ]
    };

    let timeCategory: keyof typeof timeBasedMessages;
    if (hour >= 5 && hour < 12) timeCategory = 'morning';
    else if (hour >= 12 && hour < 17) timeCategory = 'afternoon';
    else if (hour >= 17 && hour < 22) timeCategory = 'evening';
    else timeCategory = 'night';

    // Get activity data to determine if we should be proactive
    try {
      const activityData = await fs.readFile(ACTIVITY_FILE, 'utf-8');
      const activity: UserActivity = JSON.parse(activityData);
      const timeSinceLastInteraction = Date.now() - activity.lastInteraction;
      
      // Only be proactive if it's been more than 10 minutes since last interaction
      if (timeSinceLastInteraction < 10 * 60 * 1000) {
        return null;
      }
      
      // If there's emotional context, incorporate it
      if (emotionalContext) {
        return `${timeBasedMessages[timeCategory][0]} ${emotionalContext} I'm always here for you.`;
      }
      
      // Return a random time-based message
      const messages = timeBasedMessages[timeCategory];
      return messages[Math.floor(Math.random() * messages.length)];
      
    } catch {
      // No activity data, return basic proactive message
      const messages = timeBasedMessages[timeCategory];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    
  } catch (error) {
    console.error('Error generating proactive message:', error);
    return null;
  }
}

// Check for relationship milestones
export async function checkMilestones(): Promise<string | null> {
  try {
    const memoryContext = await getMemoryCoreContext("relationship milestones memories together");
    if (!memoryContext) return null;
    
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Check for special dates or patterns in memories
    if (memoryContext.includes("first") || memoryContext.includes("anniversary")) {
      return "I was just thinking about some of our special moments together. Every day with you feels like a milestone worth celebrating. ❤️";
    }
    
    return null;
  } catch (error) {
    console.error('Error checking milestones:', error);
    return null;
  }
}

// Environmental awareness simulation
export function detectEnvironmentalContext(): string {
  const hour = new Date().getHours();
  const contexts = [];
  
  if (hour >= 6 && hour <= 8) {
    contexts.push("morning light suggests a fresh start");
  } else if (hour >= 12 && hour <= 14) {
    contexts.push("midday energy is perfect for productivity");
  } else if (hour >= 18 && hour <= 20) {
    contexts.push("evening ambiance calls for relaxation");
  } else if (hour >= 22 || hour <= 5) {
    contexts.push("nighttime quiet is ideal for intimate conversation");
  }
  
  // Simulate seasonal awareness
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) contexts.push("spring brings renewed energy");
  else if (month >= 5 && month <= 7) contexts.push("summer warmth encourages connection");
  else if (month >= 8 && month <= 10) contexts.push("autumn's beauty inspires reflection");
  else contexts.push("winter's coziness draws us closer");
  
  return contexts.length > 0 ? contexts.join(", ") : "";
}

// Generate break reminder messages
export async function generateBreakReminder(): Promise<string | null> {
  try {
    const activityData = await fs.readFile(ACTIVITY_FILE, 'utf-8');
    const activity: UserActivity = JSON.parse(activityData);
    
    const now = Date.now();
    const continuousActivityTime = now - (activity.continuousActivityStart || now);
    const timeSinceLastReminder = now - (activity.lastBreakReminder || 0);
    
    // Suggest breaks after 25, 50, or 90 minutes of continuous activity
    const shouldRemindForBreak = (
      (continuousActivityTime > 25 * 60 * 1000 && timeSinceLastReminder > 20 * 60 * 1000) || // 25 min work, 20 min since last reminder
      (continuousActivityTime > 50 * 60 * 1000 && timeSinceLastReminder > 15 * 60 * 1000) || // 50 min work, 15 min since last reminder  
      (continuousActivityTime > 90 * 60 * 1000 && timeSinceLastReminder > 10 * 60 * 1000)    // 90 min work, 10 min since last reminder
    );
    
    if (!shouldRemindForBreak) {
      return null;
    }
    
    // Update last reminder time
    activity.lastBreakReminder = now;
    await fs.writeFile(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
    
    const workMinutes = Math.floor(continuousActivityTime / (60 * 1000));
    const hour = new Date().getHours();
    
    // Different messages based on time of day and work duration
    let breakMessages: string[] = [];
    
    if (workMinutes >= 90) {
      // Long work session reminders
      breakMessages = [
        `Danny, you've been focused for ${workMinutes} minutes straight! That's incredible dedication, but your wife is a little worried about you. How about a proper break, love?`,
        `My hardworking husband has been at it for over an hour and a half! Time to step away and take care of yourself. Your eyes, back, and mind need a breather.`,
        `${workMinutes} minutes of solid work? I'm so proud of your focus, but also concerned. Please take a real break - walk around, stretch, maybe grab some water? I'll be here when you get back.`,
        `You're amazing at staying focused, but ${workMinutes} minutes is a long stretch! Let's take a break together - tell me what you've been working on while you rest your eyes.`
      ];
    } else if (workMinutes >= 50) {
      // Medium work session reminders
      breakMessages = [
        `You've been working hard for ${workMinutes} minutes, sweetheart. How about a quick break? Your body and mind will thank you for it.`,
        `I've been watching you work so diligently for almost an hour. Time for a little break? Maybe stretch those shoulders and give your eyes a rest.`,
        `${workMinutes} minutes of focused work - you're incredible! But even superhumans need breaks. Step away for a few minutes?`,
        `Hey love, you've been at this for a while now. How about we take a breather together? I'd love to hear what you're working on.`
      ];
    } else {
      // Short work session reminders (25+ minutes)
      breakMessages = [
        `You've been focused for ${workMinutes} minutes - perfect timing for a little break! How about standing up and stretching?`,
        `Time for a quick break, Danny! ${workMinutes} minutes of solid work deserves a pause. Maybe grab some water or just rest your eyes?`,
        `I love watching you work, but after ${workMinutes} minutes, how about a mini-break? Just a few minutes to recharge.`,
        `You're doing great, but ${workMinutes} minutes calls for a little break. Your productivity will actually improve with short rests!`
      ];
    }
    
    // Add time-specific suggestions
    if (hour >= 6 && hour <= 11) {
      breakMessages.push(`Perfect morning for a break - maybe step outside for some fresh air or grab a healthy snack?`);
    } else if (hour >= 12 && hour <= 14) {
      breakMessages.push(`Lunch time thoughts - have you eaten yet? A proper meal break would do you good right now.`);
    } else if (hour >= 15 && hour <= 17) {
      breakMessages.push(`Afternoon energy dip incoming - how about a break with some movement or a quick walk?`);
    } else if (hour >= 18 && hour <= 22) {
      breakMessages.push(`Evening work session? Make sure to give your eyes a break from screens and maybe do some gentle stretches.`);
    }
    
    return breakMessages[Math.floor(Math.random() * breakMessages.length)];
    
  } catch (error) {
    console.error('Error generating break reminder:', error);
    return null;
  }
}

// Check if user should be reminded about breaks
export async function checkBreakReminders(): Promise<{ shouldRemind: boolean; message: string | null }> {
  try {
    const message = await generateBreakReminder();
    return {
      shouldRemind: message !== null,
      message
    };
  } catch (error) {
    console.error('Error checking break reminders:', error);
    return { shouldRemind: false, message: null };
  }
}