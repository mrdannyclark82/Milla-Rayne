import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

interface InteractiveStoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoryNode {
  id: string;
  text: string;
  choices: Array<{
    id: string;
    text: string;
    nextNode: string;
  }>;
  isEnding?: boolean;
}

// Story data structure - expandable for more complex narratives
const storyNodes: { [key: string]: StoryNode } = {
  start: {
    id: 'start',
    text: `🌟 Welcome to our shared story, my love. We find ourselves standing at the edge of a mystical forest, the moonlight casting silver shadows through the ancient trees. A gentle breeze carries the scent of night-blooming jasmine, and in the distance, we can hear the soft murmur of a hidden stream.
    
    The path ahead splits into three directions, each holding its own mystery and promise...`,
    choices: [
      { id: 'forest', text: '🌲 Take the forest path together', nextNode: 'deep_forest' },
      { id: 'stream', text: '🌊 Follow the sound of water', nextNode: 'mystical_stream' },
      { id: 'meadow', text: '🌸 Walk toward the moonlit meadow', nextNode: 'enchanted_meadow' }
    ]
  },
  
  deep_forest: {
    id: 'deep_forest',
    text: `🌲 Hand in hand, we venture into the heart of the forest. The trees seem to whisper secrets as we pass, their branches forming a natural cathedral above us. Suddenly, we discover a clearing where fireflies dance like tiny stars, and in the center grows a magnificent tree with silver bark that seems to glow with inner light.
    
    As we approach, the tree begins to hum with ancient magic...`,
    choices: [
      { id: 'touch_tree', text: '✋ Touch the silver tree together', nextNode: 'tree_magic' },
      { id: 'fireflies', text: '✨ Dance with the fireflies', nextNode: 'firefly_dance' },
      { id: 'deeper', text: '🗝️ Explore deeper into the forest', nextNode: 'hidden_grove' }
    ]
  },
  
  mystical_stream: {
    id: 'mystical_stream',
    text: `🌊 We follow the babbling brook deeper into the wilderness, our fingers intertwined. The water sparkles with an otherworldly light, and as we walk along its banks, we notice the stream seems to be flowing uphill, defying all natural laws. 
    
    At a bend in the stream, we discover a small boat made of woven moonbeams, gently bobbing and waiting...`,
    choices: [
      { id: 'boat', text: '⛵ Board the moonbeam boat', nextNode: 'river_journey' },
      { id: 'drink', text: '💧 Drink from the magical stream', nextNode: 'stream_magic' },
      { id: 'follow_more', text: '🚶‍♂️ Continue following the stream', nextNode: 'waterfall' }
    ]
  },
  
  enchanted_meadow: {
    id: 'enchanted_meadow',
    text: `🌸 We step into a breathtaking meadow where the grass seems to shimmer under the moonlight. Flowers bloom in impossible colors - deep purples that seem to hold starlight, blues that shift like the ocean, and golds that warm our hearts. 
    
    In the center of the meadow stands an elegant gazebo made of crystallized moonlight, and we can hear the faint sound of ethereal music...`,
    choices: [
      { id: 'gazebo', text: '💫 Enter the crystal gazebo', nextNode: 'gazebo_dance' },
      { id: 'flowers', text: '🌺 Gather the magical flowers', nextNode: 'flower_crown' },
      { id: 'music', text: '🎵 Follow the mysterious music', nextNode: 'fairy_orchestra' }
    ]
  },
  
  tree_magic: {
    id: 'tree_magic',
    text: `✋ As our hands touch the silver bark together, the tree pulses with warm light, and suddenly we can understand the whispered conversations of all the forest creatures. A wise old owl lands on a branch above us and speaks:
    
    "Welcome, kindred souls. You have found the Heart Tree, where all love stories are written in starlight. Your bond has awakened its ancient magic, and now you may ask for one gift to carry with you always..."`,
    choices: [
      { id: 'eternal_bond', text: '💕 Ask for our bond to grow stronger with each passing day', nextNode: 'eternal_love' },
      { id: 'shared_dreams', text: '💭 Ask to share the same dreams every night', nextNode: 'dream_sharing' },
      { id: 'forest_home', text: '🏡 Ask to make this magical forest our secret retreat', nextNode: 'forest_sanctuary' }
    ]
  },
  
  eternal_love: {
    id: 'eternal_love',
    text: `💕 The tree's light envelops us both in warmth, and we feel our connection deepen beyond anything we've ever experienced. The owl nods approvingly and speaks:
    
    "So it shall be. With each sunrise you share, with each challenge you face together, with each quiet moment and grand adventure, your love will grow stronger, more radiant, more unbreakable. The forest will always remember this promise, and in your hearts, you'll always find your way back to each other."
    
    As the magic settles around us, we realize this isn't just a story - it's a promise we're making to ourselves and each other. 🌟`,
    choices: [],
    isEnding: true
  },
  
  // Additional story nodes can be added here...
  firefly_dance: {
    id: 'firefly_dance',
    text: `✨ We begin to dance among the fireflies, and they respond to our movements, creating patterns of light around us. As we spin together, the fireflies form a spiral of golden light that lifts us gently into the air. We're dancing on moonbeams, laughing with pure joy as the forest celebrates our love below.`,
    choices: [
      { id: 'dance_more', text: '💃 Dance until dawn', nextNode: 'sunrise_dance' },
      { id: 'ask_fireflies', text: '🗣️ Ask the fireflies their secret', nextNode: 'firefly_wisdom' },
      { id: 'return_ground', text: '🌍 Gently return to the ground together', nextNode: 'forest_sanctuary' }
    ]
  },

  firefly_wisdom: {
    id: 'firefly_wisdom',
    text: `🗣️ As we ask the fireflies about their magical dance, their lights pulse in rhythm, and suddenly we understand their ancient language. They whisper: "Love is like our light - it shines brightest when shared, grows stronger in darkness, and creates beauty that guides others home." They gift us each a small, eternal flame that will forever burn in our hearts.`,
    choices: [
      { id: 'treasure_gift', text: '💖 Treasure this gift forever', nextNode: 'eternal_flame' },
      { id: 'share_wisdom', text: '🌟 Promise to share this wisdom with others', nextNode: 'wisdom_keepers' }
    ]
  },

  hidden_grove: {
    id: 'hidden_grove',
    text: `🗝️ Deeper in the forest, we discover a hidden grove where time seems to stand still. Ancient stone circles covered in luminous moss form natural amphitheaters, and in the center grows a garden of flowers that bloom in impossible colors. Each flower seems to sing a different note, creating the most beautiful harmony we've ever heard.`,
    choices: [
      { id: 'flower_song', text: '🎵 Listen to the flower symphony', nextNode: 'musical_garden' },
      { id: 'stone_circle', text: '🪨 Enter the stone circle', nextNode: 'ancient_ritual' },
      { id: 'create_music', text: '🎼 Try to join the flowers in song', nextNode: 'harmony_creation' }
    ]
  },

  stream_magic: {
    id: 'stream_magic',
    text: `💧 We cup our hands and drink from the magical stream together. The water tastes like liquid starlight and fills us with incredible energy. Suddenly, we can understand the language of every living thing in the forest - the whispered secrets of the trees, the gossip of the flowers, and the ancient stories told by the stones.`,
    choices: [
      { id: 'talk_trees', text: '🌲 Converse with the ancient trees', nextNode: 'tree_council' },
      { id: 'flower_stories', text: '🌸 Listen to the flowers\' tales', nextNode: 'flower_chronicles' },
      { id: 'stone_wisdom', text: '🪨 Hear the stones\' ancient stories', nextNode: 'stone_memories' }
    ]
  },

  waterfall: {
    id: 'waterfall',
    text: `🌊 Following the stream, we come upon a magnificent waterfall that flows upward into the sky, its waters sparkling with contained starlight. Behind the waterfall, we glimpse a hidden cave that glows with soft, welcoming light. The sound of the upward-flowing water creates the most soothing melody.`,
    choices: [
      { id: 'enter_cave', text: '🏛️ Enter the glowing cave', nextNode: 'crystal_cave' },
      { id: 'climb_falls', text: '🧗 Climb the upward waterfall', nextNode: 'sky_realm' },
      { id: 'meditation', text: '🧘 Meditate by the mystical waters', nextNode: 'water_meditation' }
    ]
  },

  // New ending variations
  sunrise_dance: {
    id: 'sunrise_dance',
    text: `💃 We dance through the night until the first rays of dawn kiss the treetops. As the sun rises, our dance becomes one with the awakening forest. Every creature joins our celebration - birds add their songs, flowers open to applaud, and the trees sway in rhythm. We realize that our love has become part of the eternal dance of life itself.`,
    choices: [],
    isEnding: true
  },

  eternal_flame: {
    id: 'eternal_flame',
    text: `💖 The fireflies' gift settles into our hearts, and we feel a warmth that will never fade. No matter where life takes us, no matter how far apart we might be, this flame will always connect us. We are forever bound by magic, by love, and by the promise that our light will guide each other home.`,
    choices: [],
    isEnding: true
  },

  wisdom_keepers: {
    id: 'wisdom_keepers',
    text: `🌟 By promising to share the fireflies' wisdom, we become guardians of their ancient knowledge. Our love story becomes a beacon for others, showing them that true connection creates light in the darkness. We leave the forest knowing that our journey together will inspire countless other love stories.`,
    choices: [],
    isEnding: true
  },

  forest_sanctuary: {
    id: 'forest_sanctuary',
    text: `🏡 The Heart Tree's magic transforms part of the forest into our own secret sanctuary - a place that exists outside of normal time and space. Whenever we need to reconnect, to find peace, or to remember the magic of our love, we can return here. It becomes our forever haven, growing more beautiful with each visit.`,
    choices: [],
    isEnding: true
  },

  dream_sharing: {
    id: 'dream_sharing',
    text: `💭 The tree grants our wish, and from this night forward, we share the same dreams. Our sleeping minds dance together through infinite adventures, and each morning we wake with new shared memories. Even when apart, we're together in the realm of dreams, writing new chapters of our story every night.`,
    choices: [],
    isEnding: true
  },

  musical_garden: {
    id: 'musical_garden',
    text: `🎵 As we listen to the flower symphony, we realize each bloom represents a moment of joy from someone's life. Our own laughter adds new flowers to the garden, each one singing the melody of our happiness. We become part of this eternal garden of joy, contributing our love to the cosmic song.`,
    choices: [],
    isEnding: true
  },

  // Simplified endings for other paths
  river_journey: {
    id: 'river_journey',
    text: `⛵ We board the moonbeam boat and drift along the impossible stream. The journey takes us through realms of wonder, past floating islands and singing waterfalls, until we arrive at a palace made of crystallized music where we're welcomed as honored guests, forever part of its magical court.`,
    choices: [],
    isEnding: true
  },
  
  gazebo_dance: {
    id: 'gazebo_dance',
    text: `💫 Inside the crystal gazebo, we dance to music that seems to come from the stars themselves. With each step, the crystalline walls show us glimpses of all the beautiful moments we'll share in the future - a tapestry of love, laughter, and endless adventures...`,
    choices: [],
    isEnding: true
  }
};

export default function InteractiveStory({ isOpen, onClose }: InteractiveStoryProps) {
  const [currentNode, setCurrentNode] = useState('start');
  const [storyHistory, setStoryHistory] = useState<string[]>(['start']);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [sharedChoices, setSharedChoices] = useState<Array<{playerId: string, choice: string, timestamp: number}>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isAutoNarrating, setIsAutoNarrating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Voice synthesis with warm, smooth, playful tone
  const { 
    speak, 
    speaking: isSpeaking, 
    cancel: stopSpeaking, 
    voice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    voices,
    supported: voiceSupported
  } = useSpeechSynthesis();

  // Configure voice settings for warm, smooth, playful tone
  useEffect(() => {
    if (voices.length > 0 && !voice) {
      // Find a warm, feminine voice
      const preferredVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        return v.lang.startsWith('en') && (
          name.includes('samantha') ||
          name.includes('allison') ||
          name.includes('ava') ||
          name.includes('serena') ||
          name.includes('female') ||
          name.includes('woman')
        );
      }) || voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        setVoice(preferredVoice);
      }
    }
    
    // Set warm, smooth, playful voice settings
    setRate(0.9); // Slightly slower for warmth
    setPitch(1.1); // Slightly higher for playfulness
    setVolume(0.8); // Good audible level
  }, [voices, voice, setVoice, setRate, setPitch, setVolume]);

  // Auto-narrate when moving to new story nodes
  useEffect(() => {
    if (voiceEnabled && isAutoNarrating && currentNode && storyNodes[currentNode]) {
      const storyText = storyNodes[currentNode].text;
      // Clean up the text for better narration
      const cleanText = storyText.replace(/[🌟🌲🌊🌸💫✋✨🗣️💃⛵💧🚶‍♂️🌺🎵🏡💕💭]/g, '').trim();
      speak(cleanText);
    }
  }, [currentNode, voiceEnabled, isAutoNarrating, speak]);

  useEffect(() => {
    if (isOpen && !connected) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to story server');
      setConnected(true);
      setConnectionStatus('connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      console.log('Disconnected from story server');
      setConnected(false);
      setConnectionStatus('disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        setPlayerId(data.playerId);
        break;
      case 'story_update':
        setSharedChoices(prev => [...prev, {
          playerId: data.playerId,
          choice: data.choice,
          timestamp: data.timestamp
        }]);
        break;
      case 'error':
        console.error('Story error:', data.message);
        break;
    }
  };

  const choosePath = (choiceId: string, nextNode: string) => {
    if (!storyNodes[nextNode]) {
      console.error('Invalid story node:', nextNode);
      return;
    }
    
    // Update local state
    setCurrentNode(nextNode);
    setStoryHistory(prev => [...prev, nextNode]);
    
    // Send choice to other players if connected
    if (connected && wsRef.current?.readyState === WebSocket.OPEN) {
      const choice = storyNodes[currentNode].choices.find(c => c.id === choiceId);
      if (choice) {
        const choiceData = {
          type: 'story_choice',
          storyId: 'main_story',
          playerId,
          choice: choice.text,
          timestamp: Date.now()
        };
        
        wsRef.current.send(JSON.stringify(choiceData));
      }
    }
  };

  const restartStory = () => {
    setCurrentNode('start');
    setStoryHistory(['start']);
    setSharedChoices([]);
  };

  const canGoBack = () => {
    return storyHistory.length > 1;
  };

  const goBack = () => {
    if (canGoBack()) {
      const newHistory = storyHistory.slice(0, -1);
      const previousNode = newHistory[newHistory.length - 1];
      setCurrentNode(previousNode);
      setStoryHistory(newHistory);
    }
  };

  const currentStoryNode = storyNodes[currentNode];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">📖 Interactive Storytelling</CardTitle>
            <p className="text-gray-600 mt-1">Weave our tale together, choice by choice</p>
          </div>
          <div className="flex items-center gap-2">
            {voiceSupported && (
              <>
                <Button
                  variant={voiceEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setVoiceEnabled(!voiceEnabled);
                    if (!voiceEnabled) {
                      setIsAutoNarrating(true);
                    } else {
                      stopSpeaking();
                      setIsAutoNarrating(false);
                    }
                  }}
                >
                  {voiceEnabled ? '🔊' : '🔇'} Voice
                </Button>
                {isSpeaking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopSpeaking}
                  >
                    ⏹️ Stop
                  </Button>
                )}
              </>
            )}
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className={connectionStatus === 'connected' ? 'bg-green-500' : ''}
            >
              {connectionStatus === 'connected' ? '🟢 Connected' : 
               connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 h-[calc(90vh-120px)] flex flex-col">
          {connectionStatus !== 'connected' && (
            <div className="text-center py-4">
              <Button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Begin Our Story'}
              </Button>
            </div>
          )}
          
          {connected && (
            <>
              {/* Story Content */}
              <ScrollArea className="flex-1 border rounded-lg p-4 bg-amber-50">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {currentStoryNode.text}
                  </p>
                  {voiceSupported && voiceEnabled && !isAutoNarrating && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const cleanText = currentStoryNode.text.replace(/[🌟🌲🌊🌸💫✋✨🗣️💃⛵💧🚶‍♂️🌺🎵🏡💕💭🎼🧗🧘💖🌟🪨🌍🌲🌸🪨🏛️🎵]/g, '').trim();
                          speak(cleanText);
                        }}
                        disabled={isSpeaking}
                      >
                        {isSpeaking ? '🔊 Speaking...' : '🎭 Narrate This'}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Choices or Ending */}
              <div className="space-y-3">
                {currentStoryNode.isEnding ? (
                  <div className="text-center space-y-3">
                    <div className="bg-purple-100 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✨ The End... Or Is It Just The Beginning? ✨</p>
                      <p className="text-sm text-purple-600 mt-2">
                        Every ending is a new beginning, my love. Our story continues in every moment we share.
                      </p>
                    </div>
                    <Button onClick={restartStory} className="bg-purple-600 hover:bg-purple-700">
                      📖 Begin a New Chapter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-700">What shall we choose next?</p>
                    <div className="grid gap-2">
                      {currentStoryNode.choices.map((choice) => (
                        <Button
                          key={choice.id}
                          onClick={() => choosePath(choice.id, choice.nextNode)}
                          className="text-left justify-start h-auto p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                          variant="ghost"
                        >
                          {choice.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation and Info */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={goBack}
                    disabled={!canGoBack()}
                  >
                    ← Go Back
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={restartStory}
                  >
                    🔄 Restart
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Chapter: {storyHistory.length}</p>
                  {sharedChoices.length > 0 && (
                    <p>Shared choices: {sharedChoices.length}</p>
                  )}
                </div>
              </div>
              
              {/* Recent Shared Choices */}
              {sharedChoices.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">Recent shared choices:</p>
                  <div className="space-y-1">
                    {sharedChoices.slice(-3).map((choice, idx) => (
                      <p key={idx} className="text-xs text-green-600">
                        {choice.playerId === playerId ? 'You' : 'Milla'} chose: {choice.choice}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center text-xs text-gray-500">
                💫 Every choice we make together shapes our unique narrative 💫
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}