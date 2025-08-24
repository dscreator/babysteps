-- Reading Questions Seed Data
-- Comprehension questions for each reading passage

-- Questions for "The Amazing Octopus" passage
INSERT INTO public.reading_questions (passage_id, question, options, correct_answer, explanation, question_type) VALUES

-- We'll use a subquery to get the passage_id for "The Amazing Octopus"
((SELECT id FROM public.reading_passages WHERE title = 'The Amazing Octopus'), 
'What is the main idea of this passage?', 
'["Octopuses are dangerous sea creatures", "Octopuses are intelligent and fascinating animals", "Octopuses live in the deepest parts of the ocean", "Octopuses are the largest sea creatures"]', 
'Octopuses are intelligent and fascinating animals', 
'The passage focuses on the remarkable abilities and characteristics of octopuses, emphasizing their intelligence and fascinating nature.', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'The Amazing Octopus'), 
'According to the passage, how many hearts does an octopus have?', 
'["One", "Two", "Three", "Four"]', 
'Three', 
'The passage explicitly states that "An octopus has three hearts that pump blue blood through its body."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The Amazing Octopus'), 
'What can you infer about octopuses based on their ability to squeeze through small openings?', 
'["They have very small brains", "They are extremely flexible", "They are afraid of tight spaces", "They prefer to live in caves"]', 
'They are extremely flexible', 
'Since octopuses can squeeze through any opening larger than their beak (the only hard part), we can infer they are very flexible.', 
'inference'),

((SELECT id FROM public.reading_passages WHERE title = 'The Amazing Octopus'), 
'What does the word "chromatophores" most likely mean?', 
'["Special arms", "Breathing organs", "Color-changing cells", "Suction cups"]', 
'Color-changing cells', 
'The passage explains that chromatophores are "special cells that contain different colored pigments" used for changing color.', 
'vocabulary'),

-- Questions for "The History of Pizza" passage
((SELECT id FROM public.reading_passages WHERE title = 'The History of Pizza'), 
'What is the main purpose of this passage?', 
'["To teach how to make pizza", "To explain the history and development of pizza", "To compare Italian and American food", "To describe different pizza toppings"]', 
'To explain the history and development of pizza', 
'The passage traces pizza from its origins in Naples through its spread to America and modern popularity.', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'The History of Pizza'), 
'When was Pizza Margherita created?', 
'["1889", "1905", "18th century", "After World War II"]', 
'1889', 
'The passage states that "The modern pizza was born in 1889 when baker Raffaele Esposito created a special pizza for Queen Margherita."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The History of Pizza'), 
'Why did pizza become popular in America after World War II?', 
'["Italian immigrants opened more restaurants", "Ingredients became cheaper", "American soldiers returning from Italy spread the word", "Television advertisements promoted it"]', 
'American soldiers returning from Italy spread the word', 
'The passage explains that pizza became widely popular "when American soldiers returning from Italy spread the word about this delicious food."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The History of Pizza'), 
'Based on the passage, what can you conclude about food traditions?', 
'["They never change over time", "They can spread and evolve in new places", "They are only popular in their country of origin", "They become less popular over time"]', 
'They can spread and evolve in new places', 
'The passage shows how pizza evolved from simple Italian flatbread to diverse American varieties, demonstrating how food traditions adapt.', 
'inference'),

-- Questions for "The Science of Sleep" passage
((SELECT id FROM public.reading_passages WHERE title = 'The Science of Sleep'), 
'What is the main idea of this passage?', 
'["Sleep is a waste of time", "Sleep is a complex process essential for health", "Dreams are the most important part of sleep", "Teenagers need less sleep than adults"]', 
'Sleep is a complex process essential for health', 
'The passage explains the complexity of sleep cycles and emphasizes the importance of adequate sleep for physical and mental health.', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'The Science of Sleep'), 
'During which stage of sleep does the body repair tissues and build muscle?', 
'["Light sleep", "REM sleep", "Deep non-REM sleep", "All stages equally"]', 
'Deep non-REM sleep', 
'The passage states that during the deepest stage of non-REM sleep, "your body repairs tissues, builds bone and muscle, and strengthens your immune system."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The Science of Sleep'), 
'How much sleep do teenagers need according to the passage?', 
'["6-8 hours", "8-10 hours", "10-12 hours", "As much as possible"]', 
'8-10 hours', 
'The passage explicitly states that "teenagers need 8-10 hours of sleep per night."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The Science of Sleep'), 
'What does "consolidation" most likely mean in the context of memory?', 
'["Forgetting information", "Strengthening and organizing memories", "Dreaming about events", "Staying awake longer"]', 
'Strengthening and organizing memories', 
'The passage mentions "memory consolidation" in the context of the brain processing and forming connections between information.', 
'vocabulary'),

-- Questions for "The Underground Railroad" passage
((SELECT id FROM public.reading_passages WHERE title = 'The Underground Railroad'), 
'What is the main idea of this passage?', 
'["The Underground Railroad was a real train system", "Harriet Tubman was the only conductor", "The Underground Railroad was a secret network that helped enslaved people escape", "The Underground Railroad operated only in the North"]', 
'The Underground Railroad was a secret network that helped enslaved people escape', 
'The passage explains that the Underground Railroad was "a secret network of people, routes, and safe houses that helped enslaved African Americans escape to freedom."', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'The Underground Railroad'), 
'Why was Harriet Tubman called "Moses"?', 
'["She lived in Egypt", "She led people to freedom like the biblical Moses", "She was very old", "She could part the waters"]', 
'She led people to freedom like the biblical Moses', 
'The passage states she "became known as Moses for leading her people to the promised land of freedom," referencing the biblical figure.', 
'inference'),

((SELECT id FROM public.reading_passages WHERE title = 'The Underground Railroad'), 
'How many trips did Harriet Tubman make into the South?', 
'["17", "19", "70", "The passage doesn''t specify"]', 
'19', 
'The passage clearly states that "Harriet Tubman made 19 trips into the South."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The Underground Railroad'), 
'What does the word "abolitionists" most likely mean?', 
'["People who supported slavery", "People who opposed slavery", "Government officials", "Railroad workers"]', 
'People who opposed slavery', 
'The context shows abolitionists working to help enslaved people escape, indicating they opposed slavery.', 
'vocabulary'),

-- Questions for "Climate Change and Ocean Acidification" passage
((SELECT id FROM public.reading_passages WHERE title = 'Climate Change and Ocean Acidification'), 
'What is the main purpose of this passage?', 
'["To explain what ocean acidification is and why it matters", "To describe different types of marine animals", "To argue against climate change", "To promote ocean tourism"]', 
'To explain what ocean acidification is and why it matters', 
'The passage introduces ocean acidification as a serious climate change effect and explains its causes and consequences.', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'Climate Change and Ocean Acidification'), 
'How much more acidic has the ocean become since the Industrial Revolution?', 
'["10%", "20%", "30%", "50%"]', 
'30%', 
'The passage states that "the ocean has become approximately 30% more acidic" since the Industrial Revolution began.', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'Climate Change and Ocean Acidification'), 
'Why are coral reefs called the "rainforests of the sea"?', 
'["They are green like forests", "They support diverse ecosystems like rainforests", "They grow very tall", "They produce oxygen"]', 
'They support diverse ecosystems like rainforests', 
'The passage explains that coral reefs "support about 25% of all marine species despite covering less than 1% of the ocean floor," showing their biodiversity.', 
'inference'),

((SELECT id FROM public.reading_passages WHERE title = 'Climate Change and Ocean Acidification'), 
'What does "irreversible" most likely mean?', 
'["Happening quickly", "Cannot be undone", "Very expensive", "Scientifically proven"]', 
'Cannot be undone', 
'In the context of environmental damage, "irreversible" means the changes cannot be reversed or undone.', 
'vocabulary'),

-- Questions for "The Power of Persuasion in Advertising" passage
((SELECT id FROM public.reading_passages WHERE title = 'The Power of Persuasion in Advertising'), 
'What is the main purpose of this passage?', 
'["To criticize all advertising", "To help readers understand persuasive techniques in advertising", "To promote specific products", "To explain how to create advertisements"]', 
'To help readers understand persuasive techniques in advertising', 
'The passage aims to educate readers about advertising techniques so they can be more informed consumers and critical thinkers.', 
'main_idea'),

((SELECT id FROM public.reading_passages WHERE title = 'The Power of Persuasion in Advertising'), 
'According to the passage, what is the "halo effect"?', 
'["When products glow in advertisements", "When people transfer positive feelings about celebrities to products", "When advertisements use bright colors", "When products are shown in good lighting"]', 
'When people transfer positive feelings about celebrities to products', 
'The passage explains that the halo effect occurs when "consumers will transfer their positive feelings about the celebrity to the product."', 
'detail'),

((SELECT id FROM public.reading_passages WHERE title = 'The Power of Persuasion in Advertising'), 
'What can you infer about why scarcity techniques work?', 
'["People like rare things more", "People are naturally competitive", "People fear missing out on opportunities", "People want to save money"]', 
'People fear missing out on opportunities', 
'The passage explains that scarcity techniques "trigger fear of missing out" and exploit the bias that people value rare things more.', 
'inference'),

((SELECT id FROM public.reading_passages WHERE title = 'The Power of Persuasion in Advertising'), 
'What does "cognitive bias" most likely mean?', 
'["A way of thinking that affects judgment", "A type of advertisement", "A marketing strategy", "A psychological disorder"]', 
'A way of thinking that affects judgment', 
'The passage uses "cognitive bias" in the context of how people think and make decisions, suggesting it''s a mental tendency that influences judgment.', 
'vocabulary');