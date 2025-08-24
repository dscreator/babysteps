-- Math Problems Seed Data
-- Covers arithmetic, algebra, geometry, and data analysis for ISEE preparation

-- Arithmetic Problems (Grade 6-8, Difficulty 1-5)
INSERT INTO public.math_problems (topic, difficulty, question, options, correct_answer, explanation, hints, grade_level) VALUES

-- Basic Arithmetic (Difficulty 1-2)
('arithmetic', 1, 'What is 24 + 37?', '["59", "61", "63", "65"]', '61', 'Add the ones place: 4 + 7 = 11. Write down 1 and carry 1. Add the tens place: 2 + 3 + 1 = 6. The answer is 61.', '["Start with the ones place", "Remember to carry when needed"]', 6),

('arithmetic', 1, 'What is 85 - 29?', '["54", "56", "58", "64"]', '56', 'Since 5 < 9, borrow from the tens place. 15 - 9 = 6. Then 7 - 2 = 5. The answer is 56.', '["You may need to borrow from the tens place", "Check your work by adding back"]', 6),

('arithmetic', 2, 'What is 12 × 15?', '["170", "180", "190", "200"]', '180', 'Break it down: 12 × 15 = 12 × (10 + 5) = (12 × 10) + (12 × 5) = 120 + 60 = 180.', '["Use the distributive property", "Break 15 into 10 + 5"]', 6),

('arithmetic', 2, 'What is 144 ÷ 12?', '["11", "12", "13", "14"]', '12', 'Think: what number times 12 equals 144? 12 × 12 = 144, so 144 ÷ 12 = 12.', '["Think about multiplication tables", "What times 12 gives 144?"]', 6),

-- Fractions and Decimals (Difficulty 2-3)
('arithmetic', 2, 'What is 3/4 + 1/8?', '["7/8", "4/12", "5/8", "1"]', '7/8', 'Find common denominator: 3/4 = 6/8. Then 6/8 + 1/8 = 7/8.', '["Find a common denominator", "Convert 3/4 to eighths"]', 7),

('arithmetic', 3, 'What is 2.5 × 0.4?', '["0.1", "1.0", "1.5", "2.0"]', '1.0', 'Multiply as whole numbers: 25 × 4 = 100. Count decimal places: 1 + 1 = 2. So 100 becomes 1.00 = 1.0.', '["Ignore decimals first, then place them", "Count total decimal places"]', 7),

('arithmetic', 3, 'Express 0.75 as a fraction in lowest terms.', '["3/4", "75/100", "15/20", "6/8"]', '3/4', '0.75 = 75/100. Divide both by 25: 75 ÷ 25 = 3, 100 ÷ 25 = 4. So 0.75 = 3/4.', '["Convert to hundredths first", "Find the greatest common factor"]', 7),

-- Percentages (Difficulty 2-4)
('arithmetic', 2, 'What is 25% of 80?', '["15", "20", "25", "30"]', '20', '25% = 1/4. So 25% of 80 = 80 ÷ 4 = 20.', '["25% is the same as 1/4", "Divide by 4"]', 7),

('arithmetic', 3, 'If a shirt costs $40 and is on sale for 30% off, what is the sale price?', '["$12", "$28", "$30", "$37"]', '$28', '30% of $40 = 0.30 × $40 = $12. Sale price = $40 - $12 = $28.', '["Find the discount amount first", "Subtract discount from original price"]', 8),

('arithmetic', 4, 'A number increased by 20% equals 72. What is the original number?', '["52", "60", "65", "68"]', '60', 'Let x be the original number. x + 0.20x = 72, so 1.20x = 72. Therefore x = 72 ÷ 1.20 = 60.', '["Set up an equation with x", "The new amount is 120% of the original"]', 8),

-- Algebra Problems (Difficulty 2-5)
('algebra', 2, 'Solve for x: x + 7 = 15', '["6", "7", "8", "22"]', '8', 'Subtract 7 from both sides: x + 7 - 7 = 15 - 7, so x = 8.', '["Subtract 7 from both sides", "Check by substituting back"]', 7),

('algebra', 3, 'Solve for y: 3y - 5 = 16', '["7", "11", "21", "63"]', '7', 'Add 5 to both sides: 3y = 21. Divide by 3: y = 7.', '["Add 5 to both sides first", "Then divide by 3"]', 7),

('algebra', 3, 'If 2x + 3 = 11, what is the value of x?', '["2", "4", "7", "14"]', '4', 'Subtract 3: 2x = 8. Divide by 2: x = 4.', '["Isolate the term with x", "Perform inverse operations"]', 7),

('algebra', 4, 'Solve for a: 4a - 7 = 2a + 9', '["2", "4", "8", "16"]', '8', 'Subtract 2a from both sides: 2a - 7 = 9. Add 7: 2a = 16. Divide by 2: a = 8.', '["Get all a terms on one side", "Get all numbers on the other side"]', 8),

('algebra', 4, 'What is the value of x² when x = -3?', '["6", "9", "-6", "-9"]', '9', 'x² = (-3)² = (-3) × (-3) = 9. Remember that negative times negative equals positive.', '["Square means multiply by itself", "Negative times negative is positive"]', 8),

('algebra', 5, 'If f(x) = 2x + 1, what is f(5)?', '["9", "10", "11", "12"]', '11', 'Substitute x = 5: f(5) = 2(5) + 1 = 10 + 1 = 11.', '["Replace x with 5", "Follow order of operations"]', 8),

-- Geometry Problems (Difficulty 2-5)
('geometry', 2, 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?', '["13 cm", "26 cm", "40 cm", "80 cm"]', '26 cm', 'Perimeter = 2(length + width) = 2(8 + 5) = 2(13) = 26 cm.', '["Add length and width first", "Then multiply by 2"]', 6),

('geometry', 2, 'What is the area of a square with side length 6 inches?', '["12 sq in", "24 sq in", "36 sq in", "72 sq in"]', '36 sq in', 'Area of square = side × side = 6 × 6 = 36 square inches.', '["Square the side length", "Area = side²"]', 6),

('geometry', 3, 'What is the area of a triangle with base 10 cm and height 6 cm?', '["16 sq cm", "30 sq cm", "60 sq cm", "120 sq cm"]', '30 sq cm', 'Area of triangle = (1/2) × base × height = (1/2) × 10 × 6 = 30 sq cm.', '["Use the formula A = (1/2)bh", "Multiply base times height, then divide by 2"]', 7),

('geometry', 3, 'A circle has a radius of 4 cm. What is its circumference? (Use π ≈ 3.14)', '["12.56 cm", "25.12 cm", "50.24 cm", "100.48 cm"]', '25.12 cm', 'Circumference = 2πr = 2 × 3.14 × 4 = 25.12 cm.', '["Use C = 2πr", "Multiply 2 × π × radius"]', 7),

('geometry', 4, 'What is the volume of a rectangular prism with length 5 cm, width 3 cm, and height 4 cm?', '["12 cu cm", "47 cu cm", "60 cu cm", "120 cu cm"]', '60 cu cm', 'Volume = length × width × height = 5 × 3 × 4 = 60 cubic cm.', '["Multiply all three dimensions", "Volume = l × w × h"]', 8),

('geometry', 4, 'In a right triangle, if one angle is 35°, what is the measure of the other acute angle?', '["35°", "45°", "55°", "65°"]', '55°', 'In a right triangle, the two acute angles sum to 90°. So the other angle = 90° - 35° = 55°.', '["Right triangles have one 90° angle", "The other two angles sum to 90°"]', 8),

('geometry', 5, 'What is the area of a circle with diameter 10 cm? (Use π ≈ 3.14)', '["31.4 sq cm", "78.5 sq cm", "157 sq cm", "314 sq cm"]', '78.5 sq cm', 'Radius = diameter ÷ 2 = 5 cm. Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 sq cm.', '["Find radius first", "Use A = πr²"]', 8),

-- Data Analysis and Statistics (Difficulty 2-5)
('data_analysis', 2, 'What is the mean of these numbers: 4, 6, 8, 10, 12?', '["6", "8", "10", "40"]', '8', 'Mean = (4 + 6 + 8 + 10 + 12) ÷ 5 = 40 ÷ 5 = 8.', '["Add all numbers first", "Then divide by how many numbers"]', 7),

('data_analysis', 2, 'What is the median of these numbers: 3, 7, 9, 12, 15?', '["7", "9", "12", "46"]', '9', 'The median is the middle number when arranged in order. The middle number is 9.', '["Arrange in order first", "Find the middle value"]', 7),

('data_analysis', 3, 'What is the mode of these numbers: 2, 5, 3, 5, 8, 5, 1?', '["2", "3", "5", "8"]', '5', 'The mode is the number that appears most frequently. 5 appears three times.', '["Count how often each number appears", "The most frequent is the mode"]', 7),

('data_analysis', 3, 'What is the range of these numbers: 15, 8, 23, 12, 19?', '["8", "15", "23", "15"]', '15', 'Range = largest value - smallest value = 23 - 8 = 15.', '["Find the largest number", "Subtract the smallest number"]', 7),

('data_analysis', 4, 'A bag contains 3 red marbles, 5 blue marbles, and 2 green marbles. What is the probability of drawing a blue marble?', '["1/2", "1/3", "1/5", "3/10"]', '1/2', 'Total marbles = 3 + 5 + 2 = 10. P(blue) = 5/10 = 1/2.', '["Count total marbles", "Probability = favorable outcomes ÷ total outcomes"]', 8),

('data_analysis', 5, 'The test scores for a class are: 85, 90, 78, 92, 88, 85, 95. What is the mean score?', '["85", "87", "88", "90"]', '87', 'Mean = (85 + 90 + 78 + 92 + 88 + 85 + 95) ÷ 7 = 613 ÷ 7 = 87.6 ≈ 87.', '["Add all scores", "Divide by number of students"]', 8);