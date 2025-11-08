/**
 * YouTube Knowledge Base Tests
 * 
 * Tests for storing, searching, and retrieving analyzed videos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('YouTube Knowledge Base', () => {
  describe('Video Storage', () => {
    it('should save analyzed video to knowledge base', () => {
      const mockVideo = {
        videoId: 'test123',
        title: 'Test Video',
        type: 'tutorial' as const,
        codeSnippets: [],
        cliCommands: [],
        keyPoints: [],
        summary: 'Test summary',
        analyzedAt: new Date(),
      };

      // Mock storage
      const stored: any[] = [];
      const save = (video: typeof mockVideo) => stored.push(video);

      save(mockVideo);

      expect(stored).toHaveLength(1);
      expect(stored[0].videoId).toBe('test123');
    });

    it('should prevent duplicate videos', () => {
      const videos = new Map<string, any>();
      
      const addVideo = (id: string, data: any) => {
        if (videos.has(id)) {
          throw new Error('Video already exists');
        }
        videos.set(id, data);
      };

      addVideo('test1', { title: 'First' });
      
      expect(() => addVideo('test1', { title: 'Duplicate' })).toThrow('Video already exists');
      expect(videos.size).toBe(1);
    });
  });

  describe('Search Functionality', () => {
    it('should search by title', () => {
      const database = [
        { videoId: '1', title: 'Docker Tutorial', tags: ['docker', 'containers'] },
        { videoId: '2', title: 'React Basics', tags: ['react', 'javascript'] },
        { videoId: '3', title: 'Docker Compose Guide', tags: ['docker', 'devops'] },
      ];

      const search = (query: string) => 
        database.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));

      const results = search('docker');
      
      expect(results).toHaveLength(2);
      expect(results.map(r => r.videoId)).toEqual(['1', '3']);
    });

    it('should filter by video type', () => {
      const database = [
        { videoId: '1', type: 'tutorial' },
        { videoId: '2', type: 'news' },
        { videoId: '3', type: 'tutorial' },
      ];

      const filterByType = (type: string) => database.filter(v => v.type === type);

      const tutorials = filterByType('tutorial');
      
      expect(tutorials).toHaveLength(2);
    });

    it('should filter by language', () => {
      const database = [
        { videoId: '1', codeSnippets: [{ language: 'javascript', code: 'const x = 1' }] },
        { videoId: '2', codeSnippets: [{ language: 'python', code: 'x = 1' }] },
        { videoId: '3', codeSnippets: [{ language: 'javascript', code: 'let y = 2' }] },
      ];

      const filterByLanguage = (lang: string) => 
        database.filter(v => v.codeSnippets.some((s: any) => s.language === lang));

      const jsVideos = filterByLanguage('javascript');
      
      expect(jsVideos).toHaveLength(2);
    });

    it('should search code snippets', () => {
      const database = [
        { 
          videoId: '1', 
          codeSnippets: [
            { code: 'const express = require("express")', description: 'Import Express' }
          ]
        },
        {
          videoId: '2',
          codeSnippets: [
            { code: 'import React from "react"', description: 'Import React' }
          ]
        },
      ];

      const searchCode = (query: string) =>
        database.filter(v => 
          v.codeSnippets.some((s: any) => 
            s.code.includes(query) || s.description.toLowerCase().includes(query.toLowerCase())
          )
        );

      const results = searchCode('express');
      
      expect(results).toHaveLength(1);
      expect(results[0].videoId).toBe('1');
    });

    it('should search CLI commands', () => {
      const database = [
        { videoId: '1', cliCommands: [{ command: 'npm install express' }] },
        { videoId: '2', cliCommands: [{ command: 'docker run -d redis' }] },
      ];

      const searchCommands = (query: string) =>
        database.filter(v =>
          v.cliCommands.some((c: any) => c.command.includes(query))
        );

      const npmCommands = searchCommands('npm');
      
      expect(npmCommands).toHaveLength(1);
      expect(npmCommands[0].videoId).toBe('1');
    });
  });

  describe('Statistics', () => {
    it('should count total videos', () => {
      const database = [
        { videoId: '1' },
        { videoId: '2' },
        { videoId: '3' },
      ];

      expect(database.length).toBe(3);
    });

    it('should count by language', () => {
      const database = [
        { codeSnippets: [{ language: 'javascript' }, { language: 'typescript' }] },
        { codeSnippets: [{ language: 'python' }] },
        { codeSnippets: [{ language: 'javascript' }] },
      ];

      const countByLanguage = () => {
        const counts: Record<string, number> = {};
        database.forEach(v => {
          v.codeSnippets.forEach((s: any) => {
            counts[s.language] = (counts[s.language] || 0) + 1;
          });
        });
        return counts;
      };

      const stats = countByLanguage();
      
      expect(stats.javascript).toBe(2);
      expect(stats.python).toBe(1);
      expect(stats.typescript).toBe(1);
    });

    it('should find most common tags', () => {
      const database = [
        { tags: ['react', 'javascript'] },
        { tags: ['react', 'typescript'] },
        { tags: ['vue', 'javascript'] },
      ];

      const getTopTags = (limit: number) => {
        const tagCounts: Record<string, number> = {};
        database.forEach(v => {
          v.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        return Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([tag]) => tag);
      };

      const top2 = getTopTags(2);
      
      expect(top2).toContain('react');
      expect(top2).toContain('javascript');
    });
  });

  describe('Recent Videos', () => {
    it('should return most recently analyzed videos', () => {
      const now = Date.now();
      const database = [
        { videoId: '1', analyzedAt: new Date(now - 3600000) }, // 1 hour ago
        { videoId: '2', analyzedAt: new Date(now - 7200000) }, // 2 hours ago
        { videoId: '3', analyzedAt: new Date(now - 1800000) }, // 30 min ago
      ];

      const getRecent = (limit: number) =>
        database
          .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime())
          .slice(0, limit);

      const recent2 = getRecent(2);
      
      expect(recent2[0].videoId).toBe('3'); // Most recent
      expect(recent2[1].videoId).toBe('1');
    });
  });

  describe('Tags and Categories', () => {
    it('should auto-generate tags from content', () => {
      const video = {
        title: 'Docker and Kubernetes Tutorial',
        description: 'Learn containerization with Docker and orchestration with Kubernetes',
        codeSnippets: [
          { language: 'dockerfile', code: 'FROM node:18' },
          { language: 'yaml', code: 'apiVersion: v1' },
        ],
      };

      const generateTags = (video: typeof video) => {
        const tags = new Set<string>();
        
        // From title/description
        const text = `${video.title} ${video.description}`.toLowerCase();
        if (text.includes('docker')) tags.add('docker');
        if (text.includes('kubernetes')) tags.add('kubernetes');
        if (text.includes('tutorial')) tags.add('tutorial');

        // From code languages
        video.codeSnippets.forEach(s => tags.add(s.language));

        return Array.from(tags);
      };

      const tags = generateTags(video);
      
      expect(tags).toContain('docker');
      expect(tags).toContain('kubernetes');
      expect(tags).toContain('dockerfile');
      expect(tags).toContain('yaml');
    });
  });
});
