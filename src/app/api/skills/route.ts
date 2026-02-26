import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const SKILLS_DIR = path.join(OPENCLAW_DIR, 'workspace', 'skills');

interface Skill {
  id: string;
  name: string;
  description: string;
  location: string;
}

export async function GET() {
  try {
    const skills: Skill[] = [];
    
    try {
      // Scan skills directory
      const skillDirs = await fs.readdir(SKILLS_DIR);
      
      for (const dir of skillDirs) {
        try {
          const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
          const content = await fs.readFile(skillPath, 'utf-8');
          
          // Parse SKILL.md
          const nameMatch = content.match(/<name>(.*?)<\/name>/);
          const descMatch = content.match(/<description>(.*?)<\/description>/);
          
          if (nameMatch) {
            skills.push({
              id: dir,
              name: nameMatch[1].trim(),
              description: descMatch ? descMatch[1].trim().slice(0, 200) : '',
              location: skillPath,
            });
          }
        } catch (e) {
          // Skip invalid skills
        }
      }
    } catch (e) {
      console.error('Failed to scan skills:', e);
    }
    
    return NextResponse.json({
      skills,
      total: skills.length,
    });
  } catch (error) {
    console.error('Failed to get skills:', error);
    return NextResponse.json({ skills: [], total: 0 }, { status: 500 });
  }
}
