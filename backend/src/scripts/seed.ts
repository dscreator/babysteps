#!/usr/bin/env tsx

/**
 * Database Seeding Script for ISEE AI Tutor
 * 
 * This script populates the database with practice content including:
 * - Math problems across all ISEE topics and difficulty levels
 * - Reading passages with comprehension questions for grades 6-8
 * - Vocabulary words with definitions, synonyms, and examples
 * - Essay prompts for narrative, expository, and persuasive writing
 * 
 * Usage:
 *   npm run db:seed
 *   or
 *   tsx src/scripts/seed.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SeedData {
  mathProblems: any[];
  readingPassages: any[];
  readingQuestions: any[];
  vocabularyWords: any[];
  essayPrompts: any[];
}

const seedData: SeedData = {
  mathProblems: [
    // Arithmetic Problems (Grade 6-8, Difficulty 1-5)
    {
      topic: 'arithmetic',
      difficulty: 1,
      question: 'What is 24 + 37?',
      options: ["59", "61", "63", "65"],
      correct_answer: '61',
      explanation: 'Add the ones place: 4 + 7 = 11. Write down 1 and carry 1. Add the tens place: 2 + 3 + 1 = 6. The answer is 61.',
      hints: ["Start with the ones place", "Remember to carry when needed"],
      grade_level: 6
    },
    {
      topic: 'arithmetic',
      difficulty: 1,
      question: 'What is 85 - 29?',
      options: ["54", "56", "58", "64"],
      correct_answer: '56',
      explanation: 'Since 5 < 9, borrow from the tens place. 15 - 9 = 6. Then 7 - 2 = 5. The answer is 56.',
      hints: ["You may need to borrow from the tens place", "Check your work by adding back"],
      grade_level: 6
    },
    {
      topic: 'arithmetic',
      difficulty: 2,
      question: 'What is 12 × 15?',
      options: ["170", "180", "190", "200"],
      correct_answer: '180',
      explanation: 'Break it down: 12 × 15 = 12 × (10 + 5) = (12 × 10) + (12 × 5) = 120 + 60 = 180.',
      hints: ["Use the distributive property", "Break 15 into 10 + 5"],
      grade_level: 6
    },
    {
      topic: 'arithmetic',
      difficulty: 2,
      question: 'What is 144 ÷ 12?',
      options: ["11", "12", "13", "14"],
      correct_answer: '12',
      explanation: 'Think: what number times 12 equals 144? 12 × 12 = 144, so 144 ÷ 12 = 12.',
      hints: ["Think about multiplication tables", "What times 12 gives 144?"],
      grade_level: 6
    },
    {
      topic: 'arithmetic',
      difficulty: 2,
      question: 'What is 3/4 + 1/8?',
      options: ["7/8", "4/12", "5/8", "1"],
      correct_answer: '7/8',
      explanation: 'Find common denominator: 3/4 = 6/8. Then 6/8 + 1/8 = 7/8.',
      hints: ["Find a common denominator", "Convert 3/4 to eighths"],
      grade_level: 7
    },
    {
      topic: 'algebra',
      difficulty: 2,
      question: 'Solve for x: x + 7 = 15',
      options: ["6", "7", "8", "22"],
      correct_answer: '8',
      explanation: 'Subtract 7 from both sides: x + 7 - 7 = 15 - 7, so x = 8.',
      hints: ["Subtract 7 from both sides", "Check by substituting back"],
      grade_level: 7
    },
    {
      topic: 'algebra',
      difficulty: 3,
      question: 'Solve for y: 3y - 5 = 16',
      options: ["7", "11", "21", "63"],
      correct_answer: '7',
      explanation: 'Add 5 to both sides: 3y = 21. Divide by 3: y = 7.',
      hints: ["Add 5 to both sides first", "Then divide by 3"],
      grade_level: 7
    },
    {
      topic: 'geometry',
      difficulty: 2,
      question: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?',
      options: ["13 cm", "26 cm", "40 cm", "80 cm"],
      correct_answer: '26 cm',
      explanation: 'Perimeter = 2(length + width) = 2(8 + 5) = 2(13) = 26 cm.',
      hints: ["Add length and width first", "Then multiply by 2"],
      grade_level: 6
    },
    {
      topic: 'geometry',
      difficulty: 2,
      question: 'What is the area of a square with side length 6 inches?',
      options: ["12 sq in", "24 sq in", "36 sq in", "72 sq in"],
      correct_answer: '36 sq in',
      explanation: 'Area of square = side × side = 6 × 6 = 36 square inches.',
      hints: ["Square the side length", "Area = side²"],
      grade_level: 6
    },
    {
      topic: 'data_analysis',
      difficulty: 2,
      question: 'What is the mean of these numbers: 4, 6, 8, 10, 12?',
      options: ["6", "8", "10", "40"],
      correct_answer: '8',
      explanation: 'Mean = (4 + 6 + 8 + 10 + 12) ÷ 5 = 40 ÷ 5 = 8.',
      hints: ["Add all numbers first", "Then divide by how many numbers"],
      grade_level: 7
    }
  ],

  readingPassages: [
    {
      title: 'The Amazing Octopus',
      content: `The octopus is one of the most fascinating creatures in the ocean. With eight arms covered in suction cups, these intelligent animals can solve puzzles, open jars, and even use tools. An octopus has three hearts that pump blue blood through its body, and it can change both its color and texture to blend perfectly with its surroundings.

What makes octopuses truly remarkable is their problem-solving ability. Scientists have observed them navigating mazes, opening childproof bottles, and remembering solutions to complex tasks. They can squeeze through any opening larger than their beak, which is the only hard part of their body.

Octopuses are also masters of disguise. They have special cells called chromatophores that contain different colored pigments. By expanding and contracting these cells, an octopus can change from bright red to pale white in less than a second. They can even make their skin bumpy or smooth to match rocks, coral, or sand.

Unfortunately, octopuses have very short lives, usually living only one to two years. Despite their intelligence, they are solitary creatures that rarely interact with others of their kind except during mating season.`,
      grade_level: 6,
      subject_area: 'science',
      word_count: 185
    },
    {
      title: 'The Science of Sleep',
      content: `Sleep is far more complex than simply closing your eyes and resting. During sleep, your brain goes through several distinct stages, each serving important functions for your physical and mental health.

The sleep cycle consists of two main types: REM (Rapid Eye Movement) sleep and non-REM sleep. Non-REM sleep has three stages, progressing from light sleep to deep sleep. During the deepest stage, your body repairs tissues, builds bone and muscle, and strengthens your immune system. This is when growth hormone is released, which is why adequate sleep is crucial for growing teenagers.

REM sleep, which occurs about 90 minutes after falling asleep, is when most vivid dreams happen. During this stage, your brain is almost as active as when you're awake. REM sleep plays a vital role in learning and memory consolidation. Your brain processes information from the day, forming connections between new and existing knowledge.

Sleep deprivation can have serious consequences. Students who don't get enough sleep often struggle with concentration, memory, and decision-making. Research shows that teenagers need 8-10 hours of sleep per night, but many get far less due to early school start times, homework, and electronic devices.

The blue light emitted by phones, tablets, and computers can interfere with your body's natural sleep cycle by suppressing melatonin production. Experts recommend avoiding screens for at least an hour before bedtime to improve sleep quality.`,
      grade_level: 7,
      subject_area: 'science',
      word_count: 245
    }
  ],

  readingQuestions: [], // Will be populated after passages are inserted

  vocabularyWords: [
    {
      word: 'abundant',
      definition: 'existing in large quantities; plentiful',
      part_of_speech: 'adjective',
      difficulty_level: 1,
      example_sentence: 'The forest was abundant with wildlife and colorful flowers.',
      synonyms: ["plentiful", "numerous", "ample"],
      antonyms: ["scarce", "rare", "limited"],
      grade_level: 6
    },
    {
      word: 'analyze',
      definition: 'to examine something carefully to understand it',
      part_of_speech: 'verb',
      difficulty_level: 1,
      example_sentence: 'Scientists analyze data to draw conclusions about their experiments.',
      synonyms: ["examine", "study", "investigate"],
      antonyms: ["ignore", "overlook", "neglect"],
      grade_level: 6
    },
    {
      word: 'comprehend',
      definition: 'to understand something completely',
      part_of_speech: 'verb',
      difficulty_level: 2,
      example_sentence: 'It took me several readings to comprehend the complex scientific article.',
      synonyms: ["understand", "grasp", "perceive"],
      antonyms: ["misunderstand", "confuse", "puzzle"],
      grade_level: 7
    },
    {
      word: 'elaborate',
      definition: 'detailed and complicated; to explain in more detail',
      part_of_speech: 'adjective/verb',
      difficulty_level: 3,
      example_sentence: 'The architect created an elaborate design for the new library building.',
      synonyms: ["detailed", "complex", "intricate"],
      antonyms: ["simple", "basic", "plain"],
      grade_level: 7
    },
    {
      word: 'advocate',
      definition: 'to support or argue for something; a person who supports a cause',
      part_of_speech: 'verb/noun',
      difficulty_level: 3,
      example_sentence: 'The environmental advocate spoke passionately about protecting endangered species.',
      synonyms: ["support", "champion", "promote"],
      antonyms: ["oppose", "discourage", "criticize"],
      grade_level: 8
    }
  ],

  essayPrompts: [
    {
      prompt: 'Think about a time when you had to be brave. Write a story about what happened, including how you felt before, during, and after the situation. Use descriptive details to help your reader understand your experience.',
      type: 'narrative',
      grade_level: 6,
      time_limit: 30,
      rubric: {
        organization: {
          excellent: "Clear beginning, middle, and end with smooth transitions",
          good: "Generally well-organized with some transitions",
          fair: "Basic organization with few transitions",
          poor: "Little organization or unclear structure"
        },
        content: {
          excellent: "Engaging story with rich details and clear personal connection",
          good: "Interesting story with good details",
          fair: "Basic story with some details",
          poor: "Unclear story with few details"
        },
        language: {
          excellent: "Varied sentence structure and precise word choice",
          good: "Generally good sentence variety and word choice",
          fair: "Some sentence variety with adequate word choice",
          poor: "Simple sentences with basic vocabulary"
        },
        conventions: {
          excellent: "Few or no errors in grammar, spelling, punctuation",
          good: "Minor errors that don't interfere with meaning",
          fair: "Some errors that occasionally interfere with meaning",
          poor: "Many errors that interfere with understanding"
        }
      }
    },
    {
      prompt: 'Your school is considering eliminating recess for middle school students to allow more time for academic subjects. Write a letter to your principal explaining whether you agree or disagree with this decision. Use specific reasons and examples to support your position.',
      type: 'persuasive',
      grade_level: 6,
      time_limit: 30,
      rubric: {
        organization: {
          excellent: "Clear position with logical argument structure",
          good: "Generally clear position with good organization",
          fair: "Basic position with some organization",
          poor: "Unclear position or poor organization"
        },
        content: {
          excellent: "Strong, specific reasons with relevant examples",
          good: "Good reasons with some examples",
          fair: "Basic reasons with few examples",
          poor: "Weak reasons or no supporting examples"
        },
        language: {
          excellent: "Persuasive language that engages the reader",
          good: "Generally persuasive with good word choice",
          fair: "Somewhat persuasive with adequate language",
          poor: "Not persuasive or inappropriate language"
        },
        conventions: {
          excellent: "Few or no errors in grammar, spelling, punctuation",
          good: "Minor errors that don't interfere with meaning",
          fair: "Some errors that occasionally interfere with meaning",
          poor: "Many errors that interfere with understanding"
        }
      }
    }
  ]
};

async function clearExistingData() {
  console.log('Clearing existing practice content...');
  
  const { error: questionsError } = await supabase
    .from('reading_questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  const { error: passagesError } = await supabase
    .from('reading_passages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  const { error: mathError } = await supabase
    .from('math_problems')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  const { error: vocabError } = await supabase
    .from('vocabulary_words')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  const { error: essayError } = await supabase
    .from('essay_prompts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (questionsError || passagesError || mathError || vocabError || essayError) {
    console.error('Error clearing data:', { questionsError, passagesError, mathError, vocabError, essayError });
    throw new Error('Failed to clear existing data');
  }
  
  console.log('✓ Cleared existing data');
}

async function seedMathProblems() {
  console.log('Seeding math problems...');
  
  const { data, error } = await supabase
    .from('math_problems')
    .insert(seedData.mathProblems);
    
  if (error) {
    console.error('Error seeding math problems:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${seedData.mathProblems.length} math problems`);
}

async function seedReadingPassages() {
  console.log('Seeding reading passages...');
  
  const { data, error } = await supabase
    .from('reading_passages')
    .insert(seedData.readingPassages)
    .select();
    
  if (error) {
    console.error('Error seeding reading passages:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${seedData.readingPassages.length} reading passages`);
  return data;
}

async function seedReadingQuestions(passages: any[]) {
  console.log('Seeding reading questions...');
  
  const octopusPassage = passages.find(p => p.title === 'The Amazing Octopus');
  const sleepPassage = passages.find(p => p.title === 'The Science of Sleep');
  
  if (!octopusPassage || !sleepPassage) {
    throw new Error('Required passages not found');
  }
  
  const questions = [
    // Questions for "The Amazing Octopus"
    {
      passage_id: octopusPassage.id,
      question: 'What is the main idea of this passage?',
      options: ["Octopuses are dangerous sea creatures", "Octopuses are intelligent and fascinating animals", "Octopuses live in the deepest parts of the ocean", "Octopuses are the largest sea creatures"],
      correct_answer: 'Octopuses are intelligent and fascinating animals',
      explanation: 'The passage focuses on the remarkable abilities and characteristics of octopuses, emphasizing their intelligence and fascinating nature.',
      question_type: 'main_idea'
    },
    {
      passage_id: octopusPassage.id,
      question: 'According to the passage, how many hearts does an octopus have?',
      options: ["One", "Two", "Three", "Four"],
      correct_answer: 'Three',
      explanation: 'The passage explicitly states that "An octopus has three hearts that pump blue blood through its body."',
      question_type: 'detail'
    },
    // Questions for "The Science of Sleep"
    {
      passage_id: sleepPassage.id,
      question: 'What is the main idea of this passage?',
      options: ["Sleep is a waste of time", "Sleep is a complex process essential for health", "Dreams are the most important part of sleep", "Teenagers need less sleep than adults"],
      correct_answer: 'Sleep is a complex process essential for health',
      explanation: 'The passage explains the complexity of sleep cycles and emphasizes the importance of adequate sleep for physical and mental health.',
      question_type: 'main_idea'
    },
    {
      passage_id: sleepPassage.id,
      question: 'How much sleep do teenagers need according to the passage?',
      options: ["6-8 hours", "8-10 hours", "10-12 hours", "As much as possible"],
      correct_answer: '8-10 hours',
      explanation: 'The passage explicitly states that "teenagers need 8-10 hours of sleep per night."',
      question_type: 'detail'
    }
  ];
  
  const { data, error } = await supabase
    .from('reading_questions')
    .insert(questions);
    
  if (error) {
    console.error('Error seeding reading questions:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${questions.length} reading questions`);
}

async function seedVocabularyWords() {
  console.log('Seeding vocabulary words...');
  
  const { data, error } = await supabase
    .from('vocabulary_words')
    .insert(seedData.vocabularyWords);
    
  if (error) {
    console.error('Error seeding vocabulary words:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${seedData.vocabularyWords.length} vocabulary words`);
}

async function seedEssayPrompts() {
  console.log('Seeding essay prompts...');
  
  const { data, error } = await supabase
    .from('essay_prompts')
    .insert(seedData.essayPrompts);
    
  if (error) {
    console.error('Error seeding essay prompts:', error);
    throw error;
  }
  
  console.log(`✓ Seeded ${seedData.essayPrompts.length} essay prompts`);
}

async function displaySummary() {
  console.log('\n📊 Seeding Summary:');
  console.log('==================');
  
  const tables = [
    { name: 'Math Problems', table: 'math_problems' },
    { name: 'Reading Passages', table: 'reading_passages' },
    { name: 'Reading Questions', table: 'reading_questions' },
    { name: 'Vocabulary Words', table: 'vocabulary_words' },
    { name: 'Essay Prompts', table: 'essay_prompts' }
  ];
  
  for (const { name, table } of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.log(`${name}: Error getting count`);
    } else {
      console.log(`${name}: ${count} items`);
    }
  }
}

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding process...\n');
    
    await clearExistingData();
    console.log();
    
    await seedMathProblems();
    const passages = await seedReadingPassages();
    await seedReadingQuestions(passages);
    await seedVocabularyWords();
    await seedEssayPrompts();
    
    await displaySummary();
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding process
if (require.main === module) {
  runSeeds();
}

export { runSeeds };