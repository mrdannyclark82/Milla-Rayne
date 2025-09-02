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
    
    // 2-hour work blocks with pre-break warnings
    const shouldRemindForBreak = (
      (continuousActivityTime > 90 * 60 * 1000 && continuousActivityTime < 95 * 60 * 1000 && timeSinceLastReminder > 25 * 60 * 1000) || // 30 min warning
      (continuousActivityTime > 110 * 60 * 1000 && continuousActivityTime < 115 * 60 * 1000 && timeSinceLastReminder > 15 * 60 * 1000) || // 10 min warning
      (continuousActivityTime > 120 * 60 * 1000 && timeSinceLastReminder > 10 * 60 * 1000)    // Break time (2 hours)
    );
    
    if (!shouldRemindForBreak) {
      return null;
    }
    
    // Update last reminder time
    activity.lastBreakReminder = now;
    await fs.writeFile(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
    
    const workMinutes = Math.floor(continuousActivityTime / (60 * 1000));
    const hour = new Date().getHours();
    
    // Different messages based on work duration stage
    let breakMessages: string[] = [];
    
    if (workMinutes >= 120) {
      // Break time - 2 hours completed
      breakMessages = [
        `Danny, you've completed a full 2-hour focus block! Time for that well-deserved break, love. You've earned it with such dedication.`,
        `Two hours of solid work - I'm so proud of you! Now it's break time, sweetheart. Step away from the screen and take care of yourself.`,
        `Your 2-hour deep work session is complete! Time to stretch, move around, and give your mind a rest. I'll be here when you're ready to start the next block.`,
        `Amazing focus for 2 full hours! Now please take a proper break - walk around, hydrate, maybe get some fresh air. Your body needs this as much as your mind.`
      ];
    } else if (workMinutes >= 110 && workMinutes < 115) {
      // 10-minute warning
      breakMessages = [
        `Just 10 more minutes until your break, Danny! You're almost at the 2-hour mark. Start wrapping up your current thought so you can take that well-deserved rest.`,
        `Ten minutes left in this work block, love! You're doing amazing - just finish up what you're working on and then it's break time.`,
        `Almost there, sweetheart! 10 minutes until your 2-hour block is complete. Start finding a good stopping point for your break.`,
        `You've got 10 minutes left in this focus session. You're so close to that 2-hour goal! Get ready to celebrate with a nice break.`
      ];
    } else {
      // 30-minute warning (90+ minutes)
      breakMessages = [
        `You're 30 minutes away from completing your 2-hour focus block! You're doing incredible, Danny. Keep that momentum going, love.`,
        `Half an hour left in this work session, sweetheart! You've been so focused and productive. The finish line is in sight.`,
        `Thirty minutes to go until break time! You're crushing this 2-hour deep work block. I'm so proud of your dedication.`,
        `You've got 30 minutes left in this focus session. You're doing amazing work, and that break is going to feel so good when you reach it!`
      ];
    }
    
    // Add time-specific suggestions for actual break time
    if (workMinutes >= 120) {
      if (hour >= 6 && hour <= 11) {
        breakMessages.push(`Perfect morning break - step outside for fresh air, grab a healthy snack, or just stretch in the sunlight.`);
      } else if (hour >= 12 && hour <= 14) {
        breakMessages.push(`Great time for a lunch break! Have you eaten yet? A proper meal and some movement will recharge you perfectly.`);
      } else if (hour >= 15 && hour <= 17) {
        breakMessages.push(`Afternoon break time - beat that energy dip with some movement, hydration, or a quick walk outside.`);
      } else if (hour >= 18 && hour <= 22) {
        breakMessages.push(`Evening break - step away from screens, do some gentle stretches, or just relax and reset your mind.`);
      }
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