import { db } from "./db";
import { teams, questions, categories } from "@shared/schema";
import { eq, inArray, not } from "drizzle-orm";
import { log } from "./index";

const categoriesData = [
  { nameEn: "Quran & Hadith", nameAr: "القرآن والحديث", color: "#10B981" },
  { nameEn: "Islamic History", nameAr: "التاريخ الإسلامي", color: "#8B5CF6" },
  { nameEn: "Omani Culture", nameAr: "الثقافة العُمانية", color: "#3B82F6" },
  { nameEn: "Arabic Language", nameAr: "اللغة العربية", color: "#F59E0B" },
  { nameEn: "General Knowledge", nameAr: "معلومات عامة", color: "#EF4444" },
];

const teamsData = [
  {
    nameEn: "Al-Bidaya",
    nameAr: "البداية",
    color: "#3B82F6",
    captain: "مهاجر محمد",
    secretKey: "666666",
    members: ["حامد محمد", "حازم محمد", "محمد سعيد (أبو مهاجر)"],
  },
  {
    nameEn: "Al-Nukhba",
    nameAr: "النخبة",
    color: "#EF4444",
    captain: "أحمد علي حمدان",
    secretKey: "555555",
    members: ["معتز سعيد", "الوارث مبارك", "مصباح"],
  },
  {
    nameEn: "Jabal Gharba",
    nameAr: "جبل غربة",
    color: "#8B5CF6",
    captain: "فهد محمد",
    secretKey: "444444",
    members: ["فايز سيف", "نبيل سيف", "هشام سيف"],
  },
];

const questionsData = [
  {
    textEn: "How many times does the word 'olive' appear in the Holy Quran?",
    textAr: "كم مرة وردت كلمة الزيتون في القرآن الكريم؟",
    optionAEn: "Once", optionAAr: "مرة",
    optionBEn: "Twice", optionBAr: "مرتين",
    optionCEn: "Four times", optionCAr: "أربع مرات",
    optionDEn: "Seven times", optionDAr: "سبع مرات",
    correctAnswer: "c", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "medium",
  },
  {
    textEn: "When was Sheikh Ahmad Al-Khalili appointed as Grand Mufti of the Sultanate of Oman?",
    textAr: "متى تم تعيين سماحة الشيخ العلامة أحمد الخليلي مفتياً عاماً للسلطنة عمان؟",
    optionAEn: "November 27, 1975", optionAAr: "٢٧ من نوفمبر عام ١٩٧٥",
    optionBEn: "November 27, 1972", optionBAr: "٢٧ من نوفمبر عام ١٩٧٢",
    optionCEn: "November 27, 1973", optionCAr: "٢٧ من نوفمبر عام ١٩٧٣",
    optionDEn: "November 27, 1974", optionDAr: "٢٧ من نوفمبر عام ١٩٧٤",
    correctAnswer: "a", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "hard",
  },
  {
    textEn: "The Omani Football Federation won the Arabian Gulf Cup title twice in its history. Which editions?",
    textAr: "فاز الاتحاد العماني لكرة القدم بلقب كأس الخليج العربي مرتين في تاريخه",
    optionAEn: "Gulf 18 and 24", optionAAr: "خليجي (١٨ و ٢٤)",
    optionBEn: "Gulf 4 and 23", optionBAr: "خليجي (٤ و ٢٣)",
    optionCEn: "Gulf 19 and 23", optionCAr: "خليجي (١٩ و ٢٣)",
    optionDEn: "Gulf 5 and 19", optionDAr: "خليجي (٥ و ١٩)",
    correctAnswer: "c", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "The word 'Dunya' (world) is singular, what is its plural?",
    textAr: "كلمة دُنيا مفرد جمعها؟",
    optionAEn: "Dunawiyat", optionAAr: "دونويات",
    optionBEn: "Dunat", optionBAr: "دُنات",
    optionCEn: "Daniyat", optionCAr: "دانيات",
    optionDEn: "Dunan", optionDAr: "دُنى",
    correctAnswer: "d", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "medium",
  },
  {
    textEn: "Which animal never drinks water throughout its life?",
    textAr: "ما هو الحيوان الذي لا يشرب الماء طوال حياته؟",
    optionAEn: "Lion", optionAAr: "الأسد",
    optionBEn: "Shark", optionBAr: "القرش",
    optionCEn: "Cheetah", optionCAr: "الفهد",
    optionDEn: "Kangaroo Rat", optionDAr: "الكنغر",
    correctAnswer: "d", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "Who is meant by 'And [by] the father and that which was born [of him]' in Surah Al-Balad, verse 3?",
    textAr: "من المقصود بقوله تعالى 'وَوَالِدٍ وَمَا وَلَدَ'؟ سورة البلد ٣",
    optionAEn: "Isa (Jesus) PBUH", optionAAr: "عيسى عليه السلام",
    optionBEn: "Nuh (Noah) PBUH", optionBAr: "نوح عليه السلام",
    optionCEn: "Adam PBUH", optionCAr: "آدم عليه السلام",
    optionDEn: "Ismail (Ishmael) PBUH", optionDAr: "إسماعيل عليه السلام",
    correctAnswer: "c", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "hard",
  },
  {
    textEn: "When did the violent Zanzibar Revolution that overthrew Arab (Al Busaidi) rule take place?",
    textAr: "إندلعت 'ثورة زنجبار' العنيفة التي أطاحت بحكم العرب (البوسعيدين) في؟",
    optionAEn: "January 12, 1964", optionAAr: "١٢ من يناير عام ١٩٦٤",
    optionBEn: "January 12, 1967", optionBAr: "١٢ من يناير عام ١٩٦٧",
    optionCEn: "January 12, 1962", optionCAr: "١٢ من يناير عام ١٩٦٢",
    optionDEn: "January 12, 1966", optionDAr: "١٢ من يناير عام ١٩٦٦",
    correctAnswer: "a", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "hard",
  },
  {
    textEn: "Al-Rahba racetrack in Barka is the main modern racing track in the Sultanate of Oman. In what year was it opened?",
    textAr: "يعد مضمار الرحبة بولاية بركاء الميدان الرئيسي والحديث للسباقات في سلطنة عمان، في أي سنة تم إفتتاحه؟",
    optionAEn: "1986", optionAAr: "١٩٨٦",
    optionBEn: "1999", optionBAr: "١٩٩٩",
    optionCEn: "2000", optionCAr: "٢٠٠٠",
    optionDEn: "2003", optionDAr: "٢٠٠٣",
    correctAnswer: "d", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Who said: 'If you see the lion's teeth showing, do not think the lion is smiling'?",
    textAr: "إذا رَأَيْتَ نُيُوبَ اللَّيْثِ بارِزَةً.. فَلا تَظُنَّنَّ أنَّ اللَّيْثَ يَبْتَسِمُ، من قال هذا البيت الشعري؟",
    optionAEn: "Ahmad Shawqi", optionAAr: "أحمد شوقي",
    optionBEn: "Al-Mutanabbi", optionBAr: "المتنبي",
    optionCEn: "Gibran Khalil Gibran", optionCAr: "جبران خليل جبران",
    optionDEn: "Antara ibn Shaddad", optionDAr: "عنترة بن شداد",
    correctAnswer: "b", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "medium",
  },
  {
    textEn: "Which animal tastes its food with its feet?",
    textAr: "الحيوان الذي يتذوق طعامه برجليه هو؟",
    optionAEn: "Ant", optionAAr: "النمل",
    optionBEn: "Jellyfish", optionBAr: "قنديل البحر",
    optionCEn: "Butterfly", optionCAr: "الفراشة",
    optionDEn: "Beetle", optionDAr: "خنفساء",
    correctAnswer: "c", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "Who was the first to name the Holy Quran 'Mushaf' (bound book)?",
    textAr: "من أول من سمى القرآن الكريم مصحفاً؟",
    optionAEn: "Abu Bakr Al-Siddiq", optionAAr: "أبو بكر الصديق",
    optionBEn: "Uthman ibn Affan", optionBAr: "عثمان بن عفان",
    optionCEn: "Prophet Muhammad PBUH", optionCAr: "الرسول صلى الله عليه وسلم",
    optionDEn: "Ali ibn Abi Talib", optionDAr: "علي بن أبي طالب",
    correctAnswer: "a", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "medium",
  },
  {
    textEn: "In which year was the 'Year of Youth' designated in the Sultanate of Oman?",
    textAr: "في أي عام تم تخصيص عام الشبيبة (عام الشباب) في سلطنة عمان؟",
    optionAEn: "1986", optionAAr: "١٩٨٦",
    optionBEn: "1984", optionBAr: "١٩٨٤",
    optionCEn: "1983", optionCAr: "١٩٨٣",
    optionDEn: "1982", optionDAr: "١٩٨٢",
    correctAnswer: "c", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Which Omani ship won 1st place globally in the Tall Ships Race 2019, from Netherlands to Denmark?",
    textAr: "السفينة العمانية التي فازت عام ٢٠١٩ بالمركز الأول عالمياً في سباق الحرية للسفن الشراعية الطويلة، هي؟",
    optionAEn: "Jewel of Muscat", optionAAr: "سفينة جوهرة مسقط",
    optionBEn: "Shabab Oman II (Ship of Peace)", optionBAr: "سفينة شباب عمان الثانية (سفينة السلام)",
    optionCEn: "Zaina Al-Bihar", optionCAr: "سفينة زينة البحار",
    optionDEn: "Shabab Oman I", optionDAr: "سفينة شباب عمان الأولى",
    correctAnswer: "b", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "hard",
  },
  {
    textEn: "In 'The knight rides the horse' - what is the grammatical role of 'the knight' (الفارس)?",
    textAr: "'يَمْتَطِي الفَارِسُ الجَوَادَ' إعراب كلمة (الفَارِسُ)",
    optionAEn: "Object (accusative)", optionAAr: "مفعول به منصوب وعلامة نصبه الفتحة الظاهرة على آخره",
    optionBEn: "Subject (nominative)", optionBAr: "فاعل مرفوع وعلامة رفعه الضمة الظاهرة على آخره",
    optionCEn: "Prepositional noun (genitive)", optionCAr: "اسم مجرور وعلامة جره الكسرة الظاهرة على آخره",
    optionDEn: "Present tense verb", optionDAr: "فعل مضارع مرفوع وعلامة رفعه الضمة",
    correctAnswer: "b", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "medium",
  },
  {
    textEn: "A wall clock strikes 6 times in 30 seconds at 6 o'clock. How many seconds does it take for 12 strikes at 12 o'clock?",
    textAr: "ساعة حائط تدق ٦ دقات في تمام الساعة السادسة، وتستغرق في ذلك ٣٠ ثانية. كم ثانية تستغرق لتدق ١٢ دقة في تمام الساعة الثانية عشرة؟",
    optionAEn: "45 seconds", optionAAr: "٤٥ ثانية",
    optionBEn: "66 seconds", optionBAr: "٦٦ ثانية",
    optionCEn: "33 seconds", optionCAr: "٣٣ ثانية",
    optionDEn: "0 seconds", optionDAr: "٠ ثانية",
    correctAnswer: "b", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "hard",
  },
  {
    textEn: "'I am the son of water, and if you put me in water, I die.' What am I?",
    textAr: "'أنا ابن الماء، وإذا وضعوني في الماء مِتُّ.. فمن أنا؟'",
    optionAEn: "Steam", optionAAr: "البخار",
    optionBEn: "Condensation", optionBAr: "التكثف",
    optionCEn: "Ice", optionCAr: "الثلج",
    optionDEn: "Boiling", optionDAr: "الغليان",
    correctAnswer: "c", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "Which Quranic Surah has all its verses ending with the letter Ha?",
    textAr: "ما هي السورة القرآنية التي تنتهي كل آياتها بحرف الهاء؟",
    optionAEn: "Surah Al-Waqi'ah", optionAAr: "سورة الواقعة",
    optionBEn: "Surah Al-Humazah", optionBAr: "سورة الهمزة",
    optionCEn: "Surah Az-Zalzalah", optionCAr: "سورة الزلزلة",
    optionDEn: "Surah Al-Qari'ah", optionDAr: "سورة القارعة",
    correctAnswer: "b", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "medium",
  },
  {
    textEn: "What is the treaty that was signed in 1833 between Oman and the United States, and who was the Omani Sultan at that time?",
    textAr: "ما هي المعاهدة التي وقعت عام ١٨٣٣ بين عُمان والولايات المتحدة الأمريكية، ومن كان السلطان العماني آنذاك؟",
    optionAEn: "Sultan Said bin Sultan Al Busaidi", optionAAr: "سلطان سعيد بن سلطان البوسعيدي",
    optionBEn: "Sultan Taimur bin Faisal Al Busaidi", optionBAr: "سلطان تيمور بن فيصل البوسعيدي",
    optionCEn: "Sultan Turki bin Thuwaini Al Busaidi", optionCAr: "سلطان تركي بن ثويني البوسعيدي",
    optionDEn: "Sultan Thuwaini bin Said Al Busaidi", optionDAr: "سلطان ثويني بن سعيد البوسعيدي",
    correctAnswer: "a", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "hard",
  },
  {
    textEn: "What is the ancient name that the Sumerians gave to Oman in their cuneiform texts?",
    textAr: "ما هو الاسم القديم الذي أطلقه السومريون على عُمان في نصوصهم المسمارية، وماذا كان يعني؟",
    optionAEn: "Magan", optionAAr: "مجان",
    optionBEn: "Mazun", optionBAr: "مزون",
    optionCEn: "Nu'man", optionCAr: "نُعمان",
    optionDEn: "The Omani Empire", optionDAr: "الإمبراطورية العمانية",
    correctAnswer: "a", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Which Imam managed to permanently expel the Portuguese from Oman and the Gulf, and founded the Ya'aruba state?",
    textAr: "مَن هو الإمام الذي استطاع طرد البرتغاليين نهائياً من عُمان والخليج، وأسس دولة اليعاربة؟",
    optionAEn: "Imam Nasir bin Murshid Al Ya'rubi", optionAAr: "الإمام ناصر بن مرشد اليعربي",
    optionBEn: "Imam Sultan bin Saif Al Ya'rubi", optionBAr: "الإمام سلطان بن سيف اليعربي",
    optionCEn: "Imam Saif bin Sultan Al Ya'rubi", optionCAr: "الإمام سيف بن سلطان اليعربي",
    optionDEn: "Imam Sultan bin Saif II", optionDAr: "الإمام سلطان بن سيف الثاني",
    correctAnswer: "a", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "hard",
  },
  {
    textEn: "Oman Vision 2040 is the national document considered the main reference for development. When was Vision 2040 actually launched?",
    textAr: "رؤية عمان ٢٠٤٠ اسم الوثيقة الوطنية التي تعتبر المرجع الأساسي للعمل التنموي في عهد السلطان هيثم، متى تم إنطلاق رؤية فعلياً؟",
    optionAEn: "January 2020", optionAAr: "يناير من عام ٢٠٢٠",
    optionBEn: "January 2022", optionBAr: "يناير من ٢٠٢٢",
    optionCEn: "January 2019", optionCAr: "يناير من ٢٠١٩",
    optionDEn: "January 2021", optionDAr: "يناير من ٢٠٢١",
    correctAnswer: "d", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "What is the name of the fund that Sultan Haitham ordered to be established in 2024 with a capital of 2 billion Omani Rials?",
    textAr: "ما هو اسم الصندوق الذي أمر السلطان هيثم بتأسيسه في عام ٢٠٢٤ برأس مال قدره ملياري ريال عماني لدعم المشاريع الكبرى والشركات الناشئة؟",
    optionAEn: "Oman Future Fund", optionAAr: "صندوق عمان للمستقبل",
    optionBEn: "Future Generations Fund", optionBAr: "صندوق الأجيال القادمة",
    optionCEn: "National Development Fund", optionCAr: "صندوق التنمية الوطنية",
    optionDEn: "Omani Technology Fund", optionDAr: "صندوق العماني للتكنولوجيا",
    correctAnswer: "a", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Oman aspires to be a global center for clean energy. What is the name of the government company responsible for regulating the green hydrogen sector?",
    textAr: "عُمان تطمح لتكون مركزاً عالمياً للطاقة النظيفة. ما اسم الشركة الحكومية التي تأسست لتكون المسؤولة عن تنظيم قطاع الهيدروجين الأخضر ومنح الامتيازات؟",
    optionAEn: "Acwa Power", optionAAr: "شركة أكورا باور",
    optionBEn: "Hydrom", optionBAr: "شركة الهيدروم",
    optionCEn: "Shell", optionCAr: "شركة شل",
    optionDEn: "OQ", optionDAr: "شركة أوكيو",
    correctAnswer: "b", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "How many Surahs (chapters) are in the Holy Quran?",
    textAr: "كم عدد سور القرآن الكريم؟",
    optionAEn: "110", optionAAr: "١١٠",
    optionBEn: "114", optionBAr: "١١٤",
    optionCEn: "120", optionCAr: "١٢٠",
    optionDEn: "100", optionDAr: "١٠٠",
    correctAnswer: "b", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "What is the longest Surah in the Holy Quran?",
    textAr: "ما هي أطول سورة في القرآن الكريم؟",
    optionAEn: "Surah Al-Imran", optionAAr: "سورة آل عمران",
    optionBEn: "Surah Al-Baqarah", optionBAr: "سورة البقرة",
    optionCEn: "Surah An-Nisa", optionCAr: "سورة النساء",
    optionDEn: "Surah Al-Ma'idah", optionDAr: "سورة المائدة",
    correctAnswer: "b", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "What is the capital of the Sultanate of Oman?",
    textAr: "ما هي عاصمة سلطنة عُمان؟",
    optionAEn: "Salalah", optionAAr: "صلالة",
    optionBEn: "Sohar", optionBAr: "صحار",
    optionCEn: "Muscat", optionCAr: "مسقط",
    optionDEn: "Nizwa", optionDAr: "نزوى",
    correctAnswer: "c", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "easy",
  },
  {
    textEn: "In which month do Muslims fast during Ramadan?",
    textAr: "في أي شهر يصوم المسلمون في رمضان؟",
    optionAEn: "The 8th month", optionAAr: "الشهر الثامن",
    optionBEn: "The 9th month", optionBAr: "الشهر التاسع",
    optionCEn: "The 10th month", optionCAr: "الشهر العاشر",
    optionDEn: "The 7th month", optionDAr: "الشهر السابع",
    correctAnswer: "b", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "How many pillars does Islam have?",
    textAr: "كم عدد أركان الإسلام؟",
    optionAEn: "3", optionAAr: "٣",
    optionBEn: "4", optionBAr: "٤",
    optionCEn: "5", optionCAr: "٥",
    optionDEn: "6", optionDAr: "٦",
    correctAnswer: "c", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "What is the name of the first mosque built in Islam?",
    textAr: "ما هو اسم أول مسجد بُني في الإسلام؟",
    optionAEn: "Al-Masjid Al-Haram", optionAAr: "المسجد الحرام",
    optionBEn: "Masjid Quba", optionBAr: "مسجد قباء",
    optionCEn: "Al-Masjid An-Nabawi", optionCAr: "المسجد النبوي",
    optionDEn: "Al-Aqsa Mosque", optionDAr: "المسجد الأقصى",
    correctAnswer: "b", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "medium",
  },
  {
    textEn: "Which planet is known as the Red Planet?",
    textAr: "أي كوكب يُعرف بالكوكب الأحمر؟",
    optionAEn: "Jupiter", optionAAr: "المشتري",
    optionBEn: "Venus", optionBAr: "الزهرة",
    optionCEn: "Mars", optionCAr: "المريخ",
    optionDEn: "Saturn", optionDAr: "زحل",
    correctAnswer: "c", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "What is the largest organ in the human body?",
    textAr: "ما هو أكبر عضو في جسم الإنسان؟",
    optionAEn: "Heart", optionAAr: "القلب",
    optionBEn: "Liver", optionBAr: "الكبد",
    optionCEn: "Skin", optionCAr: "الجلد",
    optionDEn: "Brain", optionDAr: "الدماغ",
    correctAnswer: "c", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "Sultan Qaboos Grand Mosque in Muscat is one of the largest mosques in the world. When was it inaugurated?",
    textAr: "يعد جامع السلطان قابوس الأكبر في مسقط من أكبر المساجد في العالم. متى تم افتتاحه؟",
    optionAEn: "1999", optionAAr: "١٩٩٩",
    optionBEn: "2001", optionBAr: "٢٠٠١",
    optionCEn: "2005", optionCAr: "٢٠٠٥",
    optionDEn: "2010", optionDAr: "٢٠١٠",
    correctAnswer: "b", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "What is the name of the holy book revealed to Prophet Muhammad (PBUH)?",
    textAr: "ما هو اسم الكتاب المقدس الذي أُنزل على النبي محمد صلى الله عليه وسلم؟",
    optionAEn: "Torah", optionAAr: "التوراة",
    optionBEn: "Bible", optionBAr: "الإنجيل",
    optionCEn: "Psalms", optionCAr: "الزبور",
    optionDEn: "Quran", optionDAr: "القرآن",
    correctAnswer: "d", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "How many times is prayer (Salah) obligatory per day in Islam?",
    textAr: "كم مرة تجب الصلاة في اليوم في الإسلام؟",
    optionAEn: "3 times", optionAAr: "٣ مرات",
    optionBEn: "4 times", optionBAr: "٤ مرات",
    optionCEn: "5 times", optionCAr: "٥ مرات",
    optionDEn: "7 times", optionDAr: "٧ مرات",
    correctAnswer: "c", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "The Omani Rial is the currency of Oman. What is the subdivision of the Rial?",
    textAr: "الريال العماني هو عملة عُمان. ما هي الفئة الفرعية للريال؟",
    optionAEn: "Fils", optionAAr: "فلس",
    optionBEn: "Baisa", optionBAr: "بيسة",
    optionCEn: "Dirham", optionCAr: "درهم",
    optionDEn: "Qirsh", optionDAr: "قرش",
    correctAnswer: "b", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "easy",
  },
  {
    textEn: "What is the traditional Omani dagger called that is worn as part of formal dress?",
    textAr: "ما هو الخنجر التقليدي العُماني الذي يُلبس كجزء من اللباس الرسمي؟",
    optionAEn: "Saif", optionAAr: "سيف",
    optionBEn: "Jambiya", optionBAr: "جنبية",
    optionCEn: "Khanjar", optionCAr: "خنجر",
    optionDEn: "Shamshir", optionDAr: "شمشير",
    correctAnswer: "c", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "easy",
  },
  {
    textEn: "In which year did the battle of Badr take place?",
    textAr: "في أي سنة هجرية وقعت غزوة بدر الكبرى؟",
    optionAEn: "1 AH", optionAAr: "السنة الأولى للهجرة",
    optionBEn: "2 AH", optionBAr: "السنة الثانية للهجرة",
    optionCEn: "3 AH", optionCAr: "السنة الثالثة للهجرة",
    optionDEn: "4 AH", optionDAr: "السنة الرابعة للهجرة",
    correctAnswer: "b", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "medium",
  },
  {
    textEn: "What is the meaning of the Arabic word 'Jabal'?",
    textAr: "ما معنى كلمة (جبل) في اللغة العربية؟",
    optionAEn: "River", optionAAr: "نهر",
    optionBEn: "Sea", optionBAr: "بحر",
    optionCEn: "Mountain", optionCAr: "جبل",
    optionDEn: "Desert", optionDAr: "صحراء",
    correctAnswer: "c", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "easy",
  },
  {
    textEn: "Who built the famous Nizwa Fort?",
    textAr: "من هو الإمام الذي بنى قلعة نزوى الشهيرة؟",
    optionAEn: "Imam Sultan bin Saif Al Ya'rubi", optionAAr: "الإمام سلطان بن سيف اليعربي",
    optionBEn: "Imam Ahmad bin Said", optionBAr: "الإمام أحمد بن سعيد",
    optionCEn: "Imam Saif bin Sultan", optionCAr: "الإمام سيف بن سلطان",
    optionDEn: "Imam Nasir bin Murshid", optionDAr: "الإمام ناصر بن مرشد",
    correctAnswer: "a", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Which companion is known as 'The Sword of Allah'?",
    textAr: "من هو الصحابي الجليل المُلقب بـ (سيف الله المسلول)؟",
    optionAEn: "Ali ibn Abi Talib", optionAAr: "علي بن أبي طالب",
    optionBEn: "Khalid ibn Al-Walid", optionBAr: "خالد بن الوليد",
    optionCEn: "Umar ibn Al-Khattab", optionCAr: "عمر بن الخطاب",
    optionDEn: "Hamza ibn Abdul-Muttalib", optionDAr: "حمزة بن عبدالمطلب",
    correctAnswer: "b", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "medium",
  },
  {
    textEn: "What is the hardest natural substance on Earth?",
    textAr: "ما هي أصلب مادة طبيعية على وجه الأرض؟",
    optionAEn: "Gold", optionAAr: "الذهب",
    optionBEn: "Iron", optionBAr: "الحديد",
    optionCEn: "Diamond", optionCAr: "الألماس",
    optionDEn: "Platinum", optionDAr: "البلاتين",
    correctAnswer: "c", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "easy",
  },
  {
    textEn: "What is the plural of the Arabic word 'Kitab' (book)?",
    textAr: "ما هو جمع كلمة (كتاب)؟",
    optionAEn: "Katabat", optionAAr: "كتبات",
    optionBEn: "Maktabat", optionBAr: "مكتبات",
    optionCEn: "Kutub", optionCAr: "كُتُب",
    optionDEn: "Kuttab", optionDAr: "كُتّاب",
    correctAnswer: "c", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "easy",
  },
  {
    textEn: "Which prophet was swallowed by a whale?",
    textAr: "من هو النبي الذي ابتلعه الحوت؟",
    optionAEn: "Yunus (Jonah)", optionAAr: "يونس عليه السلام",
    optionBEn: "Ibrahim (Abraham)", optionBAr: "إبراهيم عليه السلام",
    optionCEn: "Musa (Moses)", optionCAr: "موسى عليه السلام",
    optionDEn: "Ayyub (Job)", optionDAr: "أيوب عليه السلام",
    correctAnswer: "a", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "What is the highest mountain peak in Oman?",
    textAr: "ما هي أعلى قمة جبلية في سلطنة عُمان؟",
    optionAEn: "Jabal Akhdar", optionAAr: "الجبل الأخضر",
    optionBEn: "Jabal Shams", optionBAr: "جبل شمس",
    optionCEn: "Jabal Samhan", optionCAr: "جبل سمحان",
    optionDEn: "Jabal Misht", optionDAr: "جبل مشط",
    correctAnswer: "b", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "Who authored the Arabic dictionary 'Al-Ain'?",
    textAr: "من هو مؤلف معجم (العين) في اللغة العربية؟",
    optionAEn: "Al-Farahidi", optionAAr: "الخليل بن أحمد الفراهيدي",
    optionBEn: "Sibawayh", optionBAr: "سيبويه",
    optionCEn: "Al-Jahiz", optionCAr: "الجاحظ",
    optionDEn: "Ibn Manzur", optionDAr: "ابن منظور",
    correctAnswer: "a", categoryEn: "Arabic Language", categoryAr: "اللغة العربية", difficulty: "hard",
  },
  {
    textEn: "In which city is the Kaaba located?",
    textAr: "في أي مدينة تقع الكعبة المشرفة؟",
    optionAEn: "Madinah", optionAAr: "المدينة المنورة",
    optionBEn: "Jerusalem", optionBAr: "القدس",
    optionCEn: "Mecca", optionCAr: "مكة المكرمة",
    optionDEn: "Riyadh", optionDAr: "الرياض",
    correctAnswer: "c", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "easy",
  },
  {
    textEn: "Which country is famously known as the land of ascending dragon?",
    textAr: "أي دولة تُعرف بلقب (أرض التنين الصاعد)؟",
    optionAEn: "Japan", optionAAr: "اليابان",
    optionBEn: "China", optionBAr: "الصين",
    optionCEn: "South Korea", optionCAr: "كوريا الجنوبية",
    optionDEn: "Vietnam", optionDAr: "فيتنام",
    correctAnswer: "d", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "hard",
  },
  {
    textEn: "In the Battle of Khandaq (The Trench), who suggested digging the trench?",
    textAr: "في غزوة الخندق (الأحزاب)، من الذي أشار على المسلمين بحفر الخندق؟",
    optionAEn: "Uthman ibn Affan", optionAAr: "عثمان بن عفان",
    optionBEn: "Salman Al-Farsi", optionBAr: "سلمان الفارسي",
    optionCEn: "Abu Bakr", optionCAr: "أبو بكر الصديق",
    optionDEn: "Zayd ibn Thabit", optionDAr: "زيد بن ثابت",
    correctAnswer: "b", categoryEn: "Islamic History", categoryAr: "التاريخ الإسلامي", difficulty: "medium",
  },
  {
    textEn: "Bahla Fort is a UNESCO World Heritage site. Where is it located?",
    textAr: "قلعة بهلاء مدرجة ضمن التراث العالمي لليونسكو. في أي محافظة تقع؟",
    optionAEn: "Muscat", optionAAr: "محافظة مسقط",
    optionBEn: "Dhofar", optionBAr: "محافظة ظفار",
    optionCEn: "Ad Dakhiliyah", optionCAr: "محافظة الداخلية",
    optionDEn: "Al Batinah North", optionDAr: "محافظة شمال الباطنة",
    correctAnswer: "c", categoryEn: "Omani Culture", categoryAr: "الثقافة العُمانية", difficulty: "medium",
  },
  {
    textEn: "What is the speed of light in a vacuum?",
    textAr: "كم تبلغ سرعة الضوء في الفراغ تقريباً؟",
    optionAEn: "300,000 km/s", optionAAr: "٣٠٠,٠٠٠ كيلومتر في الثانية",
    optionBEn: "150,000 km/s", optionBAr: "١٥٠,٠٠٠ كيلومتر في الثانية",
    optionCEn: "1,000 km/s", optionCAr: "١,٠٠٠ كيلومتر في الثانية",
    optionDEn: "3,000,000 km/s", optionDAr: "٣,٠٠٠,٠٠٠ كيلومتر في الثانية",
    correctAnswer: "a", categoryEn: "General Knowledge", categoryAr: "معلومات عامة", difficulty: "medium",
  },
  {
    textEn: "Which companion is known as the translator of the Quran?",
    textAr: "من هو الصحابي المُلقب بـ (ترجمان القرآن)؟",
    optionAEn: "Abdullah ibn Masud", optionAAr: "عبدالله بن مسعود",
    optionBEn: "Abdullah ibn Abbas", optionBAr: "عبدالله بن عباس",
    optionCEn: "Ali ibn Abi Talib", optionCAr: "علي بن أبي طالب",
    optionDEn: "Ubayy ibn Ka'b", optionDAr: "أُبي بن كعب",
    correctAnswer: "b", categoryEn: "Quran & Hadith", categoryAr: "القرآن والحديث", difficulty: "medium",
  }
];

export async function seedDatabase() {
  try {
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values(categoriesData);
      log(`Inserted ${categoriesData.length} categories`, "seed");
    }

    const existingTeams = await db.select().from(teams);
    const existingQuestions = await db.select().from(questions);

    if (existingTeams.length > 0) {
      log("Teams exist, cleaning up and syncing to seed teams...", "seed");

      // Keep only the three configured teams, identified by their unique secret keys
      const allowedSecretKeys = teamsData.map((t) => t.secretKey);
      await db
        .delete(teams)
        .where(not(inArray(teams.secretKey, allowedSecretKeys)));

      // Upsert / sync the remaining teams by secretKey
      for (const teamData of teamsData) {
        const [existing] = await db
          .select()
          .from(teams)
          .where(eq(teams.secretKey, teamData.secretKey));

        if (existing) {
          await db
            .update(teams)
            .set({
              nameEn: teamData.nameEn,
              nameAr: teamData.nameAr,
              captain: teamData.captain,
              members: teamData.members,
              color: teamData.color,
            })
            .where(eq(teams.id, existing.id));
        } else {
          await db.insert(teams).values(teamData);
        }
      }

      log("Teams cleaned and synced to three configured teams", "seed");

      if (existingQuestions.length < questionsData.length) {
        log(`Found ${existingQuestions.length} questions. Inserting new ones...`, "seed");

        // Find which questions are missing by comparing textEn
        const existingTexts = new Set(existingQuestions.map(q => q.textEn));
        const newQuestions = questionsData.filter(q => !existingTexts.has(q.textEn));

        if (newQuestions.length > 0) {
          await db.insert(questions).values(newQuestions);
          log(`Inserted ${newQuestions.length} new questions`, "seed");
        }
      }
      return;
    }

    log("Seeding database with teams and questions...", "seed");

    await db.insert(teams).values(teamsData);
    log(`Inserted ${teamsData.length} teams`, "seed");

    if (existingQuestions.length < questionsData.length) {
      const existingTexts = new Set(existingQuestions.map(q => q.textEn));
      const newQuestions = questionsData.filter(q => !existingTexts.has(q.textEn));
      if (newQuestions.length > 0) {
        await db.insert(questions).values(newQuestions);
        log(`Inserted ${newQuestions.length} new questions`, "seed");
      }
    }

    log("Database seeding complete!", "seed");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
