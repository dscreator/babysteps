-- Vocabulary Words Seed Data
-- Age-appropriate vocabulary for grades 6-8 with definitions, examples, and synonyms

INSERT INTO public.vocabulary_words (word, definition, part_of_speech, difficulty_level, example_sentence, synonyms, antonyms, grade_level) VALUES

-- Grade 6 Vocabulary (Difficulty 1-2)
('abundant', 'existing in large quantities; plentiful', 'adjective', 1, 'The forest was abundant with wildlife and colorful flowers.', '["plentiful", "numerous", "ample"]', '["scarce", "rare", "limited"]', 6),

('analyze', 'to examine something carefully to understand it', 'verb', 1, 'Scientists analyze data to draw conclusions about their experiments.', '["examine", "study", "investigate"]', '["ignore", "overlook", "neglect"]', 6),

('benefit', 'something that helps or gives an advantage', 'noun', 1, 'One benefit of regular exercise is improved health.', '["advantage", "gain", "profit"]', '["disadvantage", "harm", "loss"]', 6),

('conclude', 'to end or to decide based on evidence', 'verb', 1, 'After reviewing all the facts, the detective was able to conclude who committed the crime.', '["finish", "determine", "decide"]', '["begin", "start", "continue"]', 6),

('demonstrate', 'to show clearly or prove', 'verb', 1, 'The teacher will demonstrate how to solve the math problem on the board.', '["show", "display", "exhibit"]', '["hide", "conceal", "obscure"]', 6),

('efficient', 'working well without wasting time or energy', 'adjective', 2, 'The new dishwasher is very efficient and uses less water than the old one.', '["effective", "productive", "capable"]', '["inefficient", "wasteful", "slow"]', 6),

('evidence', 'facts or information that prove something is true', 'noun', 2, 'The lawyer presented strong evidence to support her client''s case.', '["proof", "facts", "data"]', '["speculation", "opinion", "guess"]', 6),

('function', 'the purpose or role of something', 'noun', 2, 'The main function of the heart is to pump blood throughout the body.', '["purpose", "role", "job"]', '["malfunction", "dysfunction"]', 6),

-- Grade 7 Vocabulary (Difficulty 2-3)
('acquire', 'to get or obtain something', 'verb', 2, 'Students acquire knowledge through reading, listening, and practicing.', '["obtain", "gain", "get"]', '["lose", "give up", "surrender"]', 7),

('comprehend', 'to understand something completely', 'verb', 2, 'It took me several readings to comprehend the complex scientific article.', '["understand", "grasp", "perceive"]', '["misunderstand", "confuse", "puzzle"]', 7),

('diverse', 'showing variety; different from each other', 'adjective', 2, 'Our school has a diverse student body with people from many different countries.', '["varied", "different", "mixed"]', '["uniform", "similar", "identical"]', 7),

('elaborate', 'detailed and complicated; to explain in more detail', 'adjective/verb', 3, 'The architect created an elaborate design for the new library building.', '["detailed", "complex", "intricate"]', '["simple", "basic", "plain"]', 7),

('emphasize', 'to give special importance to something', 'verb', 2, 'The coach will emphasize the importance of teamwork during practice.', '["stress", "highlight", "underscore"]', '["downplay", "minimize", "ignore"]', 7),

('generate', 'to create or produce something', 'verb', 2, 'Wind turbines generate electricity from the power of moving air.', '["create", "produce", "make"]', '["destroy", "consume", "use up"]', 7),

('hypothesis', 'an educated guess that can be tested', 'noun', 3, 'The scientist formed a hypothesis about why the plants were growing so slowly.', '["theory", "prediction", "assumption"]', '["fact", "certainty", "proof"]', 7),

('interpret', 'to explain the meaning of something', 'verb', 3, 'Art critics interpret paintings differently based on their own experiences.', '["explain", "translate", "decode"]', '["misinterpret", "confuse", "misunderstand"]', 7),

('maintain', 'to keep something in good condition', 'verb', 2, 'It''s important to maintain your bicycle by keeping it clean and oiled.', '["preserve", "keep", "sustain"]', '["neglect", "abandon", "destroy"]', 7),

('obvious', 'easy to see or understand; clear', 'adjective', 2, 'It was obvious from her smile that she was happy about the good news.', '["clear", "evident", "apparent"]', '["hidden", "unclear", "obscure"]', 7),

-- Grade 8 Vocabulary (Difficulty 3-5)
('advocate', 'to support or argue for something; a person who supports a cause', 'verb/noun', 3, 'The environmental advocate spoke passionately about protecting endangered species.', '["support", "champion", "promote"]', '["oppose", "discourage", "criticize"]', 8),

('coherent', 'logical and easy to understand', 'adjective', 3, 'The student''s essay was coherent and well-organized with clear transitions between ideas.', '["logical", "clear", "organized"]', '["confusing", "illogical", "incoherent"]', 8),

('contemporary', 'belonging to the present time; modern', 'adjective', 3, 'Contemporary art often uses new materials and techniques not available to earlier artists.', '["modern", "current", "present-day"]', '["ancient", "old-fashioned", "historical"]', 8),

('controversy', 'a disagreement or argument about something important', 'noun', 4, 'The new school policy created controversy among parents and teachers.', '["debate", "dispute", "argument"]', '["agreement", "consensus", "harmony"]', 8),

('credible', 'believable and trustworthy', 'adjective', 3, 'The witness gave a credible account of what happened during the accident.', '["believable", "reliable", "trustworthy"]', '["unbelievable", "unreliable", "doubtful"]', 8),

('diminish', 'to become or make smaller or less important', 'verb', 4, 'The loud music began to diminish as we walked away from the concert.', '["decrease", "reduce", "lessen"]', '["increase", "grow", "expand"]', 8),

('inevitable', 'certain to happen; unavoidable', 'adjective', 4, 'After the storm clouds gathered, rain seemed inevitable.', '["unavoidable", "certain", "bound to happen"]', '["avoidable", "preventable", "uncertain"]', 8),

('perspective', 'a way of looking at or thinking about something', 'noun', 3, 'Reading books from different cultures gives you a broader perspective on the world.', '["viewpoint", "outlook", "point of view"]', '["narrow view", "bias", "prejudice"]', 8),

('profound', 'very deep or having great meaning', 'adjective', 4, 'The teacher''s words had a profound impact on how the student viewed learning.', '["deep", "meaningful", "significant"]', '["shallow", "superficial", "trivial"]', 8),

('reluctant', 'unwilling or hesitant to do something', 'adjective', 3, 'The shy student was reluctant to speak in front of the entire class.', '["unwilling", "hesitant", "resistant"]', '["eager", "willing", "enthusiastic"]', 8),

('significant', 'important or meaningful', 'adjective', 3, 'The discovery of the ancient artifacts was significant for understanding the civilization.', '["important", "meaningful", "notable"]', '["insignificant", "trivial", "unimportant"]', 8),

('substantial', 'large in amount, size, or importance', 'adjective', 4, 'The scholarship provided substantial financial help for the student''s college education.', '["considerable", "large", "significant"]', '["small", "minor", "insignificant"]', 8),

('synthesize', 'to combine different ideas or information to create something new', 'verb', 5, 'Good writers synthesize information from multiple sources to support their arguments.', '["combine", "merge", "integrate"]', '["separate", "divide", "isolate"]', 8),

('valid', 'based on truth or sound reasoning', 'adjective', 3, 'The scientist''s conclusion was valid because it was supported by careful research.', '["sound", "reasonable", "legitimate"]', '["invalid", "false", "unreasonable"]', 8),

('versatile', 'able to be used in many different ways', 'adjective', 4, 'A smartphone is a versatile device that can be used for communication, entertainment, and work.', '["adaptable", "flexible", "multi-purpose"]', '["limited", "inflexible", "specialized"]', 8);