export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  difficulty: Difficulty;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const GANESH_STORY = {
  title: "The Sacred Legend of Lord Ganesha",
  subtitle: "A Wonderful Tale of Love, Wisdom, and Courage for Young Champions",
  chapters: [
    {
      title: "Chapter 1: The Golden Figurine at Mount Kailash",
      content: `High upon snowy Mount Kailash, Goddess Parvati wanted a loyal helper of her own. With motherly love, she gently gathered fragrant golden turmeric, sandalwood, and sweet herbs from her own body. With careful hands, she shaped a radiant, smiling young boy.

Parvati lovingly breathed her own divine life (Prana) into the figurine. The boy opened his eyes, smiled brightly, and called her "Mataji!" (Mother). Parvati handed him a wooden staff and said with a warm hug: "My brave son, stand guard at our doorway. Do not let anyone enter while I take my holy bath." The boy proudly stood guard at the entrance.`
    },
    {
      title: "Chapter 2: The Standoff at the Door",
      content: `Soon, Lord Shiva returned from his quiet meditation in the mountains. He walked cheerfully toward his home. Suddenly, the young boy stepped forward with his staff and said politely but firmly: "Stop, please! My mother is bathing inside. Nobody can enter without her permission!"

Shiva smiled and explained: "Little boy, I am Lord Shiva, Parvati's husband and the Master of Kailash. This is my home."

The boy, who had never seen Shiva before, replied respectfully: "Whoever you are, my mother's word is my highest duty. Please wait until she steps outside." Shiva called his friendly helpers, Nandi the bull and the Shiva-Ganas, to gently convince the boy to step aside.`
    },
    {
      title: "Chapter 3: The Big Celestial Clash",
      content: `When Nandi and the Ganas tried to push past the doorway, the brave boy held up his staff. Blessed with his mother Parvati's boundless cosmic energy, he was surprisingly strong! With quick, clever moves, he pushed back the whole army.

Even King Indra and the gods from the heavens arrived to help, but the boy deflected every arrow and spark with his wooden staff. No one could pass the loyal boy who stood protecting his mother's wish.`
    },
    {
      title: "Chapter 4: The Trident of Shiva",
      content: `Seeing that nobody could pass the determined young guardian, Lord Shiva stepped forward himself. A dramatic battle took place on the snowy mountaintop. In the heat of the struggle, Shiva threw his glowing three-pronged spear—the Trishula.

The magical weapon struck, and with a flash of light, the young boy's head was severed. The brave boy fell quietly to the ground.`
    },
    {
      title: "Chapter 5: Mother Parvati's Great Demand",
      content: `Hearing the noise, Mother Parvati rushed outside. When she saw her beloved boy lying still on the ground, tears of deep sorrow and fierce anger filled her eyes. She took her mighty form of Adi Parashakti! The sky grew dark, and the three worlds began to tremble.

All the gods, led by Lord Brahma, bowed before her and pleaded: "Mother, please calm your anger! We will do whatever you ask!"

Parvati wiped her tears and made two great promises for peace:
1. "My brave son must be brought back to life right now!"
2. "He must be honored before all other gods! Whenever anyone begins a prayer, a school year, or a new journey, they must pray to my son first!"
Lord Shiva lovingly agreed to her wishes.`
    },
    {
      title: "Chapter 6: The Elephant Head from the North",
      content: `Lord Shiva sent his messengers on a special mission: "Travel to the North—the lucky direction of wisdom and peaceful thoughts. Bring the head of the very first living creature you find sleeping peacefully facing north."

The messengers journeyed through enchanted forests and found a noble, wise elephant sleeping peacefully with its head turned to the north. With respectful prayers, they brought the elephant's head back to Mount Kailash.

Lord Shiva gently placed the elephant head onto the boy's shoulders. Sprinkling holy water and chanting sacred prayers, Shiva breathed life back into him. The boy opened his eyes, gave a trumpet of joy, and hugged his parents!`
    },
    {
      title: "Chapter 7: Ganapati, The Lord of Blessings",
      content: `Parvati was overjoyed to have her son back. Lord Shiva adopted him and announced: "From today, you are the leader of all my Ganas! You shall be called Ganapati and Ganesha."

The gods showered him with wonderful titles:
- Vighnaharta: The kind friend who removes all worries and obstacles from good people.
- Prathama Pujya: The first god to be worshiped before starting any work, study, or celebration!

The auspicious day he was given new life is celebrated every year as Ganesh Chaturthi!`
    },
    {
      title: "Chapter 8: The Little Mouse Friend (Mushakraj)",
      content: `In heaven, a proud singer named Krauncha accidentally stepped on a wise sage's foot and forgot to say sorry. The sage turned him into a giant mischievous mouse! Banished to earth, the big mouse began digging holes and eating crops in Sage Parashara's garden.

The sage prayed to Ganesha for help. Ganesha arrived with a smile and threw his magical golden loop—the Pasha. The loop caught the naughty mouse gently. The mouse realized his mistake, said sorry, and asked: "Lord Ganesha, please let me stay by your side forever!"

Ganesha made him his favorite little vehicle and companion, named Mushakraj. It teaches all children that Ganesha can easily guide restless energy and desires with wisdom and kindness.`
    },
    {
      title: "Chapter 9: The Moon's Silly Laughter & The Modak Belt",
      content: `One Ganesh Chaturthi night, Ganesha enjoyed twenty-one delicious modaks at a festive party. Riding happily on his little mouse Mushakraj, a small snake slithered across the trail. The mouse got startled, stumbled, and Ganesha took a tumble! His round tummy popped open slightly, and a few modaks spilled out onto the grass.

Ganesha laughed, scooped the sweet modaks back into his tummy, and gently tied the friendly snake around his waist like a colorful belt (Udarabandha)!

Up in the night sky, Chandra (the Moon God) was watching. Being very proud of his silvery beauty, the Moon laughed loudly and teased Ganesha. Ganesha looked up and taught the Moon a lesson: "Pride is not good! Your bright light is gone, and anyone who looks at you on Ganesh Chaturthi will face silly false blame (Mithya Dosha)!"

The Moon felt very sorry and asked for forgiveness. Kind Ganesha softened the rule: the moon would slowly grow and shrink over 15 days, shining at its fullest on Purnima.`
    },
    {
      title: "Chapter 10: Ekadanta & Writing The Mahabharata",
      content: `When Sage Ved Vyasa wanted to write the giant epic story of the Mahabharata (with 100,000 poems!), he needed a very fast and patient writer. He asked Lord Ganesha.

Ganesha said: "I will write for you, but you must recite the story without stopping for even one breath!"
Clever Sage Vyasa replied: "Deal! But you must understand the deep meaning of every verse before writing it down!"

While writing at lightning speed, Ganesha's pen snapped in half! Rather than stopping the recitation, Ganesha bravely broke off his own right tusk, dipped it into ink, and kept writing without missing a beat! That is why he is called Ekadanta (The Lord with One Tusk).`
    },
    {
      title: "Chapter 11: The Cosmic Fruit & The Durva Grass",
      content: `One day, Sage Narada brought a golden mango of wisdom (Gyana Pazham) to Mount Kailash. Shiva and Parvati decided to give it to whichever son circled the entire universe three times first.

Kartikeya jumped onto his swift peacock and zoomed into space. But wise Ganesha calmly walked around his mother Parvati and father Shiva three times! When asked why, Ganesha smiled: "My loving parents are my whole world and universe!" Touched by his wisdom and love, his parents proudly gave him the golden fruit.

Later, when Ganesha swallowed a fiery monster named Analasura to protect the world, his tummy got very hot. Sages offered 21 blades of fresh green Durva grass, which instantly cooled him down! That is why 21 Durva blades and 21 modaks are lovingly offered to him.`
    },
    {
      title: "Chapter 12: 10 Days of Joy & Visarjan",
      content: `Ganesh Chaturthi is celebrated for 10 joyous days with colorful clay idols, modaks, and flower garlands. In 1893, freedom fighter Lokmanya Tilak turned the celebration into big public street festivals so all families and neighbors could celebrate together in friendship.

On the 10th day, called Anant Chaturdashi, families carry Bappa to rivers and oceans with cheerful singing and dancing: "Ganpati Bappa Morya, Pudhchya Varshi Laukariya!" (O Lord Ganesha, come back early next year!). The clay dissolves softly in the water, reminding us that love and wisdom are everywhere, even when Bappa returns home to Mount Kailash.`
    }
  ]
};

export const KID_QUESTIONS: Question[] = [
  // ================= 20 EASY QUESTIONS (Simple, fun, iconic for kids) =================
  {
    id: 1,
    difficulty: 'easy',
    category: "Ganesha's Favorites",
    question: "What is Lord Ganesha's most favorite sweet treat in the whole world?",
    options: [
      "Steamed sweet Modak 🥟",
      "Chocolate chip cookie 🍪",
      "Strawberry ice cream 🍦",
      "Crispy french fries 🍟"
    ],
    correctIndex: 0,
    explanation: "Modaks filled with sweet coconut and jaggery are Lord Ganesha's absolute favorite treat!"
  },
  {
    id: 2,
    difficulty: 'easy',
    category: "Divine Look",
    question: "What magnificent animal head does Lord Ganesha have?",
    options: [
      "A roaring Lion head 🦁",
      "A gentle and wise Elephant head 🐘",
      "A playful Monkey head 🐒",
      "A soaring Eagle head 🦅"
    ],
    correctIndex: 1,
    explanation: "Lord Ganesha has a wise, gentle elephant head that symbolizes great wisdom and memory!"
  },
  {
    id: 3,
    difficulty: 'easy',
    category: "Best Friends",
    question: "What tiny animal friend is Lord Ganesha's special vehicle (vahana)?",
    options: [
      "A tiny, clever Mouse 🐭",
      "A hopping Kangaroo 🦘",
      "A slow Turtle 🐢",
      "A speedy Cheetah 🐆"
    ],
    correctIndex: 0,
    explanation: "Lord Ganesha rides upon a tiny, loyal mouse named Mushakraj!"
  },
  {
    id: 4,
    difficulty: 'easy',
    category: "Divine Family",
    question: "Who is Lord Ganesha's loving mother?",
    options: [
      "Goddess Lakshmi",
      "Goddess Parvati",
      "Goddess Saraswati",
      "Goddess Ganga"
    ],
    correctIndex: 1,
    explanation: "Goddess Parvati lovingly created Ganesha and is his caring mother."
  },
  {
    id: 5,
    difficulty: 'easy',
    category: "Divine Family",
    question: "Who is Lord Ganesha's powerful father?",
    options: [
      "Lord Shiva",
      "Lord Brahma",
      "Lord Indra",
      "Lord Surya"
    ],
    correctIndex: 0,
    explanation: "Lord Shiva, the great ascetic who lives on Mount Kailash, is Ganesha's father."
  },
  {
    id: 6,
    difficulty: 'easy',
    category: "Divine Family",
    question: "Who is Lord Ganesha's brave brother who rides a colorful peacock?",
    options: [
      "Lord Kartikeya (Murugan)",
      "Lord Hanuman",
      "Lord Balarama",
      "Lord Sugriva"
    ],
    correctIndex: 0,
    explanation: "Lord Kartikeya is Ganesha's brother and rides a beautiful peacock named Mayura."
  },
  {
    id: 7,
    difficulty: 'easy',
    category: "Festival Fun",
    question: "How many days do we usually celebrate the grand Ganesh Chaturthi festival?",
    options: [
      "Just 1 day",
      "3 days",
      "10 joyous days",
      "30 days"
    ],
    correctIndex: 2,
    explanation: "Ganesh Chaturthi is celebrated for 10 glorious days, ending on Anant Chaturdashi!"
  },
  {
    id: 8,
    difficulty: 'easy',
    category: "Festival Fun",
    question: "What famous, joyful chant do kids and families shout during the festival?",
    options: [
      "Ganpati Bappa Morya!",
      "Happy New Year!",
      "Abracadabra!",
      "Hocus Pocus!"
    ],
    correctIndex: 0,
    explanation: "'Ganpati Bappa Morya!' is the joyful cheer that echoes in every street and home!"
  },
  {
    id: 9,
    difficulty: 'easy',
    category: "Festival Fun",
    question: "What is the name of the big festival celebrating Lord Ganesha's arrival?",
    options: [
      "Diwali",
      "Holi",
      "Ganesh Chaturthi",
      "Raksha Bandhan"
    ],
    correctIndex: 2,
    explanation: "Ganesh Chaturthi is the sacred birthday and festival of Lord Ganesha!"
  },
  {
    id: 10,
    difficulty: 'easy',
    category: "Festival Fun",
    question: "On the last day of the festival, what do we do with clay Ganesha idols?",
    options: [
      "Keep them in a dark box forever",
      "Gently immerse them in water (Visarjan) with prayers",
      "Launch them into space on a rocket",
      "Bury them under the bed"
    ],
    correctIndex: 1,
    explanation: "During Visarjan, clay idols are immersed in water so Bappa can return home to Mount Kailash!"
  },
  {
    id: 11,
    difficulty: 'easy',
    category: "Divine Look",
    question: "Why is Lord Ganesha called 'Ekadanta'?",
    options: [
      "Because he has only one ear",
      "Because he has only one complete tusk (the other is broken)",
      "Because he has one eye",
      "Because he wears one shoe"
    ],
    correctIndex: 1,
    explanation: "'Ekadanta' means 'One-Tusked', because one of his tusks was broken to write a great story!"
  },
  {
    id: 12,
    difficulty: 'easy',
    category: "Ganesha's Favorites",
    question: "What bright red flower does Lord Ganesha love to receive in prayers?",
    options: [
      "Red Hibiscus (Jaswand)",
      "White Daisy",
      "Blue Orchid",
      "Yellow Dandelion"
    ],
    correctIndex: 0,
    explanation: "Red hibiscus flowers are Lord Ganesha's favorite floral offering!"
  },
  {
    id: 13,
    difficulty: 'easy',
    category: "Divine Look",
    question: "Why does Lord Ganesha have large elephant ears?",
    options: [
      "To fly like an airplane",
      "To listen patiently and carefully to everyone's prayers",
      "To keep the sun out of his eyes",
      "To hide sweets behind them"
    ],
    correctIndex: 1,
    explanation: "His large ears teach us to be great listeners and hear every prayer with compassion."
  },
  {
    id: 14,
    difficulty: 'easy',
    category: "Divine Blessings",
    question: "Before starting a new school exam or prayer, who do we pray to first?",
    options: [
      "Lord Ganesha",
      "The Sandman",
      "The Tooth Fairy",
      "Peter Pan"
    ],
    correctIndex: 0,
    explanation: "Lord Ganesha is always prayed to first for good luck, wisdom, and clear obstacles!"
  },
  {
    id: 15,
    difficulty: 'easy',
    category: "Eco Festival",
    question: "What eco-friendly material is best for making Ganesha idols?",
    options: [
      "Natural clay and mud (Mitti)",
      "Hard plastic",
      "Toxic chemicals",
      "Styrofoam"
    ],
    correctIndex: 0,
    explanation: "Natural clay idols dissolve harmlessly in water and protect mother nature!"
  },
  {
    id: 16,
    difficulty: 'easy',
    category: "Divine Home",
    question: "Where is Lord Ganesha's peaceful snowy mountain home located?",
    options: [
      "Mount Kailash in the Himalayas",
      "In the Grand Canyon",
      "Under the Pacific Ocean",
      "On top of the Eiffel Tower"
    ],
    correctIndex: 0,
    explanation: "Lord Ganesha lives happily with Lord Shiva and Goddess Parvati on holy Mount Kailash."
  },
  {
    id: 17,
    difficulty: 'easy',
    category: "Divine Blessings",
    question: "What does the sweet name 'Vighnaharta' mean for children?",
    options: [
      "The Maker of Ice Cream",
      "The Remover of all Obstacles and Troubles",
      "The Fast Runner",
      "The Master of Drums"
    ],
    correctIndex: 1,
    explanation: "'Vighnaharta' means the kind protector who clears hurdles from our path!"
  },
  {
    id: 18,
    difficulty: 'easy',
    category: "Divine Look",
    question: "What does Lord Ganesha's big, cute belly represent?",
    options: [
      "He ate too much pizza",
      "He holds and digests all the universe's wisdom peacefully",
      "He forgot to do exercise",
      "He swallowed a giant basketball"
    ],
    correctIndex: 1,
    explanation: "His round belly symbolizes that he can peacefully contain and understand the whole universe."
  },
  {
    id: 19,
    difficulty: 'easy',
    category: "Sacred Symbols",
    question: "Which sacred symbol of peace and beginning is closely linked to Ganesha?",
    options: [
      "The sacred symbol ॐ (Om)",
      "A question mark (?)",
      "A smiley face 😊",
      "A dollar sign ($)"
    ],
    correctIndex: 0,
    explanation: "Lord Ganesha's divine form represents the primordial cosmic sound ॐ (Om)!"
  },
  {
    id: 20,
    difficulty: 'easy',
    category: "Ganesha's Trunk",
    question: "What can Lord Ganesha hold gently with his super-strong trunk?",
    options: [
      "A tiny sweet modak or a massive tree trunk!",
      "Only feather pillows",
      "Nothing at all",
      "Only water balloons"
    ],
    correctIndex: 0,
    explanation: "An elephant trunk is wonderful: it is strong enough to lift big logs, yet gentle enough to pick up a tiny modak!"
  },

  // ================= 15 MEDIUM QUESTIONS (Story adventures for curious kids) =================
  {
    id: 21,
    difficulty: 'medium',
    category: "Story of Birth",
    question: "How did Mother Parvati first make the boy before giving him life?",
    options: [
      "She ordered a toy from a magic shop",
      "She shaped him gently from golden turmeric and sandalwood paste from her body",
      "She carved him out of a block of ice",
      "She baked him in an oven like bread"
    ],
    correctIndex: 1,
    explanation: "Mother Parvati sculpted the boy out of turmeric and sandalwood paste, then breathed life into him!"
  },
  {
    id: 22,
    difficulty: 'medium',
    category: "Guarding the Door",
    question: "Why did the young boy stop Lord Shiva from entering the house?",
    options: [
      "He wanted to play hide-and-seek",
      "He was strictly obeying his mother's order to let no one in while she bathed",
      "He didn't like Shiva's clothes",
      "He lost the house key"
    ],
    correctIndex: 1,
    explanation: "The loyal boy had never seen Shiva before and promised his mother to let nobody pass."
  },
  {
    id: 23,
    difficulty: 'medium',
    category: "Guarding the Door",
    question: "What simple item did Mother Parvati give the boy to help him stand guard?",
    options: [
      "A wooden staff (danda)",
      "A water gun",
      "A magic wand",
      "A whistle"
    ],
    correctIndex: 0,
    explanation: "Mother Parvati gave him a sturdy wooden staff (danda) to guard the doorway."
  },
  {
    id: 24,
    difficulty: 'medium',
    category: "The Cosmic Race",
    question: "How did Ganesha win the race around the world against his brother Kartikeya?",
    options: [
      "He put rocket boosters on his mouse",
      "He walked around his parents 3 times, saying parents are his entire universe!",
      "He took a shortcut through a secret cave",
      "Kartikeya fell asleep on the way"
    ],
    correctIndex: 1,
    explanation: "Ganesha proved his deep wisdom by walking around his parents, who represent the whole universe!"
  },
  {
    id: 25,
    difficulty: 'medium',
    category: "Writing Mahabharata",
    question: "Why did Ganesha snap off his own tusk while writing the Mahabharata?",
    options: [
      "His pen broke, and he refused to break his promise to write without stopping",
      "He bumped into a heavy bookshelf",
      "He wanted to use it to eat apples",
      "It fell out because he was teething"
    ],
    correctIndex: 0,
    explanation: "When his reed pen broke, Ganesha broke his tusk to keep writing the sacred epic without pausing!"
  },
  {
    id: 26,
    difficulty: 'medium',
    category: "Writing Mahabharata",
    question: "Which wise sage recited the 100,000 verses of the Mahabharata for Ganesha to write?",
    options: [
      "Sage Ved Vyasa",
      "Sage Valmiki",
      "Sage Vishwamitra",
      "Sage Agastya"
    ],
    correctIndex: 0,
    explanation: "Great Sage Ved Vyasa recited the epic, and Lord Ganesha wrote down every word!"
  },
  {
    id: 27,
    difficulty: 'medium',
    category: "The Moon Story",
    question: "Why did Chandra (the Moon) burst out laughing at Lord Ganesha on Chaturthi night?",
    options: [
      "Ganesha told a funny knock-knock joke",
      "Ganesha tripped after seeing a snake, and his modaks spilled out",
      "Ganesha was wearing silly shoes",
      "The mouse started singing a funny song"
    ],
    correctIndex: 1,
    explanation: "Mushakraj got scared by a snake and tripped, causing Ganesha's modaks to spill, which made the Moon laugh rudely."
  },
  {
    id: 28,
    difficulty: 'medium',
    category: "The Moon Story",
    question: "What did Ganesha do with the harmless snake after picking up his modaks?",
    options: [
      "He gently tied the snake around his tummy like a belt",
      "He threw it up to the clouds",
      "He put it inside his backpack",
      "He made it wear a party hat"
    ],
    correctIndex: 0,
    explanation: "Ganesha cheerfully wrapped the snake around his belly as an Udarabandha (waist belt)!"
  },
  {
    id: 29,
    difficulty: 'medium',
    category: "The Moon Story",
    question: "What is said to happen if you look at the moon on Ganesh Chaturthi night?",
    options: [
      "You get turned into a frog",
      "You might face false blame or silly misunderstandings (Mithya Dosha)",
      "Your hair turns bright green",
      "Your alarm clock stops working"
    ],
    correctIndex: 1,
    explanation: "Due to Ganesha's lesson to the proud moon, viewing the Chaturthi moon can lead to false accusations."
  },
  {
    id: 30,
    difficulty: 'medium',
    category: "The Moon Story",
    question: "How did kind Ganesha soften the curse on the Moon after the Moon said sorry?",
    options: [
      "The Moon waxes and wanes over 15 days, reaching full glow on Purnima",
      "The Moon can only shine during lunch time",
      "The Moon is only allowed out on weekends",
      "The Moon must wear sunglasses forever"
    ],
    correctIndex: 0,
    explanation: "Ganesha forgave the Moon and decreed it would wax and wane in phases, becoming full on Purnima."
  },
  {
    id: 31,
    difficulty: 'medium',
    category: "The Celestial Battle",
    question: "Which weapon did Lord Shiva throw during the standoff at the door?",
    options: [
      "His sacred three-pronged spear, the Trishula",
      "A boomerang",
      "A magical net",
      "A golden arrow"
    ],
    correctIndex: 0,
    explanation: "In the dramatic clash, Lord Shiva threw his divine trident, the Trishula."
  },
  {
    id: 32,
    difficulty: 'medium',
    category: "Divine Blessings",
    question: "What does the special boon 'Prathama Pujya' mean for Ganesha?",
    options: [
      "He gets to eat dessert before dinner",
      "He is honored and worshiped FIRST before any other god in every ritual",
      "He is the tallest of all the gods",
      "He won first prize in a marathon"
    ],
    correctIndex: 1,
    explanation: "'Prathama Pujya' means 'First to be Worshiped', guaranteeing blessings before any new beginning."
  },
  {
    id: 33,
    difficulty: 'medium',
    category: "Offerings",
    question: "How many modaks are traditionally placed on a plate for Ganesha's special offering?",
    options: [
      "5 modaks",
      "10 modaks",
      "21 modaks",
      "100 modaks"
    ],
    correctIndex: 2,
    explanation: "Offering 21 delicious modaks is the auspicious number beloved by Lord Ganesha!"
  },
  {
    id: 34,
    difficulty: 'medium',
    category: "Best Friends",
    question: "What royal title is given to Ganesha's mouse to show he is the King of Mice?",
    options: [
      "Mushakraj",
      "Mickey",
      "Speedy",
      "Jerry"
    ],
    correctIndex: 0,
    explanation: "He is honorably called 'Mushakraj' (The King of Mice)!"
  },
  {
    id: 35,
    difficulty: 'medium',
    category: "The Sacred Quest",
    question: "In which direction did Shiva's messengers travel to find an animal head?",
    options: [
      "Toward the North (Uttara)",
      "Toward the South",
      "Toward the West",
      "Toward the East"
    ],
    correctIndex: 0,
    explanation: "Shiva commanded them to search toward the North, the direction of wisdom and peaceful thoughts."
  },

  // ================= 15 HARD QUESTIONS (Deep story facts made fun for curious learners) =================
  {
    id: 36,
    difficulty: 'hard',
    category: "Mouse Origins",
    question: "Who was Mushakraj in heaven before being turned into a mouse?",
    options: [
      "A heavenly musician (Gandharva) named Krauncha",
      "A mischievous cloud fairy",
      "A king from ancient Egypt",
      "A star from the Milky Way"
    ],
    correctIndex: 0,
    explanation: "Before his transformation, the mouse was a celestial musician named Krauncha in Indra's court."
  },
  {
    id: 37,
    difficulty: 'hard',
    category: "Mouse Origins",
    question: "Why was Krauncha turned into a giant mouse by Sage Vamadeva?",
    options: [
      "He accidentally stepped on the sage's foot and forgot to show humility",
      "He sang out of tune at a concert",
      "He ate the sage's lunch without asking",
      "He overslept on Monday morning"
    ],
    correctIndex: 0,
    explanation: "Krauncha carelessly stepped on Sage Vamadeva's foot without apologizing, earning the mouse curse."
  },
  {
    id: 38,
    difficulty: 'hard',
    category: "Subduing the Mouse",
    question: "Which wise sage's ashram was being dug up by the giant mouse before Ganesha helped?",
    options: [
      "Sage Parashara",
      "Sage Dronacharya",
      "Sage Kripacharya",
      "Sage Sandipani"
    ],
    correctIndex: 0,
    explanation: "Sage Parashara's quiet forest hermitage was troubled by the mouse, so he prayed to Ganesha for rescue."
  },
  {
    id: 39,
    difficulty: 'hard',
    category: "Subduing the Mouse",
    question: "What glowing tool did Ganesha throw to capture the mouse without harming it?",
    options: [
      "His golden divine loop / noose (Pasha)",
      "A giant fishing net",
      "A cage made of diamonds",
      "A bowl of melted cheese"
    ],
    correctIndex: 0,
    explanation: "Lord Ganesha cast his divine noose (Pasha), which coiled through the tunnels and caught the mouse safely."
  },
  {
    id: 40,
    difficulty: 'hard',
    category: "Sacred Grass",
    question: "What cooling green grass with 21 blades is offered to Lord Ganesha?",
    options: [
      "Durva grass (Bermuda grass)",
      "Lemon grass",
      "Bamboo grass",
      "Seaweed"
    ],
    correctIndex: 0,
    explanation: "Cooling Durva grass is offered in clusters of 21 blades to soothe and honor Lord Ganesha."
  },
  {
    id: 41,
    difficulty: 'hard',
    category: "Defeating the Fire Monster",
    question: "Why did Ganesha need cooling Durva grass to soothe his tummy?",
    options: [
      "He swallowed a fiery demon named Analasura to protect the world!",
      "He ate five bowls of super-spicy chili peppers",
      "He drank hot boiling tea too quickly",
      "He accidentally swallowed a lit candle"
    ],
    correctIndex: 0,
    explanation: "Ganesha swallowed the fire-demon Analasura to save everyone; 21 Durva blades cooled the fiery heat!"
  },
  {
    id: 42,
    difficulty: 'hard',
    category: "The Cosmic Race",
    question: "What was the name of the divine mango of supreme knowledge in the brother's contest?",
    options: [
      "Gyana Pazham (The Fruit of Supreme Wisdom)",
      "The Alphonso Mango",
      "The Golden Apple",
      "The Magic Peach"
    ],
    correctIndex: 0,
    explanation: "Sage Narada brought the 'Gyana Pazham' (The Fruit of Knowledge) to test the brothers' wisdom."
  },
  {
    id: 43,
    difficulty: 'hard',
    category: "The Northern Search",
    question: "Why did Lord Shiva specifically choose the North (Uttarayana) for finding the head?",
    options: [
      "North represents the sacred realm of wisdom, devas, and spiritual peace",
      "Because the south was too windy",
      "Because the messengers liked cold weather",
      "Because it was downhill from Kailash"
    ],
    correctIndex: 0,
    explanation: "In Vedic lore, North (Uttarayana) is the sacred direction of spiritual enlightenment and the deities."
  },
  {
    id: 44,
    difficulty: 'hard',
    category: "History of the Festival",
    question: "Which Indian freedom fighter started the big public Ganesh festivals in 1893 to unite people?",
    options: [
      "Lokmanya Bal Gangadhar Tilak",
      "Mahatma Gandhi",
      "Subhas Chandra Bose",
      "Bhagat Singh"
    ],
    correctIndex: 0,
    explanation: "Lokmanya Tilak transformed the home prayer into a huge public festival (Sarvajanik Ganeshotsav) to unite everyone!"
  },
  {
    id: 45,
    difficulty: 'hard',
    category: "Festival Calendar",
    question: "What is the special name of the 10th day when Ganesha idols are immersed in water?",
    options: [
      "Anant Chaturdashi",
      "Vijayadashami",
      "Maha Shivaratri",
      "Guru Purnima"
    ],
    correctIndex: 0,
    explanation: "The grand farewell and immersion ceremony takes place on Anant Chaturdashi!"
  },
  {
    id: 46,
    difficulty: 'hard',
    category: "The Moon Lesson",
    question: "Which great avatar was once falsely blamed for a missing jewel because he saw the Chaturthi moon?",
    options: [
      "Lord Krishna (The Syamantaka jewel)",
      "Lord Rama",
      "Lord Buddha",
      "Lord Vamana"
    ],
    correctIndex: 0,
    explanation: "Even Lord Krishna faced false accusations regarding the Syamantaka gem after glimpsing the Chaturthi moon's reflection!"
  },
  {
    id: 47,
    difficulty: 'hard',
    category: "Writing Mahabharata",
    question: "What clever condition did Sage Vyasa set so he could catch his breath while reciting?",
    options: [
      "Ganesha had to fully understand each poem before writing it down",
      "Ganesha had to sing every tenth sentence",
      "Ganesha had to write with his eyes closed",
      "Vyasa was allowed to take a 10-minute nap every hour"
    ],
    correctIndex: 0,
    explanation: "Vyasa gave Ganesha tricky verses so Ganesha paused to think, giving Vyasa time to compose new poems!"
  },
  {
    id: 48,
    difficulty: 'hard',
    category: "Meaning of Names",
    question: "What does the sacred name 'Ganapati' literally mean?",
    options: [
      "Leader and Protector of the Ganas (the people and divine hosts)",
      "The Master of the Jungle",
      "The King of Mountains",
      "The Singer of Hymns"
    ],
    correctIndex: 0,
    explanation: "'Gana' means hosts or groups of beings, and 'Pati' means Lord or Leader!"
  },
  {
    id: 49,
    difficulty: 'hard',
    category: "Parvati's Promises",
    question: "What two conditions did Mother Parvati ask for before stopping her cosmic anger?",
    options: [
      "Her son must be revived immediately, and he must be worshiped first of all gods!",
      "She wanted a palace of gold and a new carriage",
      "She asked for an army of elephants and tigers",
      "She wanted the sun to shine only at night"
    ],
    correctIndex: 0,
    explanation: "Parvati demanded that her son be brought back to life and honored as Prathama Pujya (first worshiped)!"
  },
  {
    id: 50,
    difficulty: 'hard',
    category: "Divine Symbolism",
    question: "What does Ganesha's versatile trunk teach students who are learning in school?",
    options: [
      "Be adaptable and curious: handle both big ideas and tiny details with care!",
      "Only focus on loud noises",
      "Never ask any questions in class",
      "Always take the easiest path"
    ],
    correctIndex: 0,
    explanation: "An elephant's trunk can snap big branches or gently pick up a tiny needle, teaching students balance and curiosity!"
  }
];

// Helper to generate balanced quiz sets: Exactly 3 Easy, 1 Medium, 2 Hard
export function generateBalancedQuizSet(): Question[] {
  const easyPool = [...KID_QUESTIONS.filter(q => q.difficulty === 'easy')].sort(() => Math.random() - 0.5);
  const medPool = [...KID_QUESTIONS.filter(q => q.difficulty === 'medium')].sort(() => Math.random() - 0.5);
  const hardPool = [...KID_QUESTIONS.filter(q => q.difficulty === 'hard')].sort(() => Math.random() - 0.5);

  const selectedEasy = easyPool.slice(0, 3);
  const selectedMed = medPool.slice(0, 1);
  const selectedHard = hardPool.slice(0, 2);

  // Progressive flow: 3 Easy -> 1 Medium -> 2 Hard
  return [...selectedEasy, ...selectedMed, ...selectedHard];
}

// Generate an extended quiz composed of multiple balanced blocks [3 Easy, 1 Med, 2 Hard]
export function generateExtendedBalancedQuiz(totalRounds = 3): Question[] {
  const allEasy = [...KID_QUESTIONS.filter(q => q.difficulty === 'easy')].sort(() => Math.random() - 0.5);
  const allMed = [...KID_QUESTIONS.filter(q => q.difficulty === 'medium')].sort(() => Math.random() - 0.5);
  const allHard = [...KID_QUESTIONS.filter(q => q.difficulty === 'hard')].sort(() => Math.random() - 0.5);

  const result: Question[] = [];
  for (let r = 0; r < totalRounds; r++) {
    // 3 Easy
    for (let i = 0; i < 3; i++) {
      if (allEasy.length) result.push(allEasy.pop()!);
    }
    // 1 Medium
    if (allMed.length) result.push(allMed.pop()!);
    // 2 Hard
    for (let i = 0; i < 2; i++) {
      if (allHard.length) result.push(allHard.pop()!);
    }
  }
  return result;
}

// Backward-compatible alias
export const QUIZ_QUESTIONS = KID_QUESTIONS;
