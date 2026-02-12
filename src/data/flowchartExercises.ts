// FlowChart Exercise Types
export type ExerciseType = 'flowchart_build' | 'true_false' | 'multiple_choice';

export interface FlowChartExercise {
  id: string;
  order: number;
  type: ExerciseType;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  content: FlowChartBuildContent | TrueFalseContent | MultipleChoiceContent;
  correctAnswer: any;
}

// Flowchart Builder Exercise
export interface FlowChartBuildContent {
  elements: FlowChartElement[];
  instructions_ar: string;
  instructions_en: string;
}

export interface FlowChartElement {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input_output' | 'connector';
  text_ar: string;
  text_en: string;
}

// True/False Exercise
export interface TrueFalseContent {
  statement_ar: string;
  statement_en: string;
}

// Multiple Choice Exercise
export interface MultipleChoiceContent {
  question_ar: string;
  question_en: string;
  choices_ar: string[];
  choices_en: string[];
}

// Exercise Data
export const flowchartExercises: FlowChartExercise[] = [
  // True/False Exercises
  {
    id: 'tf-1',
    order: 1,
    type: 'true_false',
    title_ar: 'المخطط الانسيابي يستخدم لتمثيل الخوارزميات',
    title_en: 'Flowcharts are used to represent algorithms',
    description_ar: 'اختبر معرفتك بأساسيات المخططات الانسيابية',
    description_en: 'Test your knowledge of flowchart basics',
    content: {
      statement_ar: 'المخطط الانسيابي هو تمثيل بصري للخطوات المتسلسلة لحل مشكلة أو تنفيذ خوارزمية',
      statement_en: 'A flowchart is a visual representation of sequential steps to solve a problem or execute an algorithm'
    },
    correctAnswer: true
  },
  {
    id: 'tf-2',
    order: 2,
    type: 'true_false',
    title_ar: 'الشكل البيضاوي يمثل عملية حسابية',
    title_en: 'An oval shape represents a calculation process',
    description_ar: 'تعرف على رموز المخططات الانسيابية',
    description_en: 'Learn about flowchart symbols',
    content: {
      statement_ar: 'في المخططات الانسيابية، يُستخدم الشكل البيضاوي لتمثيل العمليات الحسابية',
      statement_en: 'In flowcharts, an oval shape is used to represent calculation processes'
    },
    correctAnswer: false // Oval is for start/end, rectangle is for processes
  },
  {
    id: 'tf-3',
    order: 3,
    type: 'true_false',
    title_ar: 'المعين يستخدم لاتخاذ القرارات',
    title_en: 'Diamond shape is used for decisions',
    description_ar: 'رموز القرارات في المخططات',
    description_en: 'Decision symbols in flowcharts',
    content: {
      statement_ar: 'الشكل المعيني (الماسي) يُستخدم في المخططات الانسيابية لتمثيل نقاط اتخاذ القرار',
      statement_en: 'A diamond shape is used in flowcharts to represent decision points'
    },
    correctAnswer: true
  },

  // Multiple Choice Exercises
  {
    id: 'mc-1',
    order: 4,
    type: 'multiple_choice',
    title_ar: 'ما هو الشكل المستخدم لبداية ونهاية المخطط؟',
    title_en: 'What shape is used for start and end of a flowchart?',
    description_ar: 'تحديد الرموز الأساسية',
    description_en: 'Identify basic symbols',
    content: {
      question_ar: 'أي شكل يُستخدم للإشارة إلى بداية ونهاية المخطط الانسيابي؟',
      question_en: 'Which shape is used to indicate the start and end of a flowchart?',
      choices_ar: ['المستطيل', 'البيضاوي', 'المعين', 'متوازي الأضلاع'],
      choices_en: ['Rectangle', 'Oval', 'Diamond', 'Parallelogram']
    },
    correctAnswer: 1 // Index of correct answer (Oval)
  },
  {
    id: 'mc-2',
    order: 5,
    type: 'multiple_choice',
    title_ar: 'ما هو الشكل المستخدم للعمليات الحسابية؟',
    title_en: 'What shape is used for calculation processes?',
    description_ar: 'رموز العمليات',
    description_en: 'Process symbols',
    content: {
      question_ar: 'أي شكل يُستخدم لتمثيل العمليات الحسابية أو معالجة البيانات؟',
      question_en: 'Which shape is used to represent calculation processes or data processing?',
      choices_ar: ['البيضاوي', 'المستطيل', 'المعين', 'الدائرة'],
      choices_en: ['Oval', 'Rectangle', 'Diamond', 'Circle']
    },
    correctAnswer: 1 // Rectangle
  },
  {
    id: 'mc-3',
    order: 6,
    type: 'multiple_choice',
    title_ar: 'ما هو الشكل المستخدم للإدخال والإخراج؟',
    title_en: 'What shape is used for input and output?',
    description_ar: 'رموز الإدخال والإخراج',
    description_en: 'Input/Output symbols',
    content: {
      question_ar: 'أي شكل يُستخدم لتمثيل عمليات الإدخال والإخراج؟',
      question_en: 'Which shape is used to represent input and output operations?',
      choices_ar: ['المستطيل', 'المعين', 'متوازي الأضلاع', 'البيضاوي'],
      choices_en: ['Rectangle', 'Diamond', 'Parallelogram', 'Oval']
    },
    correctAnswer: 2 // Parallelogram
  },

  // Flowchart Building Exercises
  {
    id: 'fb-1',
    order: 7,
    type: 'flowchart_build',
    title_ar: 'بناء مخطط بسيط لجمع رقمين',
    title_en: 'Build a simple flowchart to add two numbers',
    description_ar: 'رتب العناصر لإنشاء مخطط انسيابي صحيح',
    description_en: 'Arrange elements to create a correct flowchart',
    content: {
      instructions_ar: 'رتب العناصر التالية لإنشاء مخطط انسيابي يقوم بقراءة رقمين، جمعهما، وطباعة النتيجة',
      instructions_en: 'Arrange the following elements to create a flowchart that reads two numbers, adds them, and prints the result',
      elements: [
        { id: 'e1', type: 'start', text_ar: 'بداية', text_en: 'Start' },
        { id: 'e2', type: 'input_output', text_ar: 'قراءة A, B', text_en: 'Read A, B' },
        { id: 'e3', type: 'process', text_ar: 'Sum = A + B', text_en: 'Sum = A + B' },
        { id: 'e4', type: 'input_output', text_ar: 'طباعة Sum', text_en: 'Print Sum' },
        { id: 'e5', type: 'end', text_ar: 'نهاية', text_en: 'End' }
      ]
    },
    correctAnswer: ['e1', 'e2', 'e3', 'e4', 'e5']
  },
  {
    id: 'fb-2',
    order: 8,
    type: 'flowchart_build',
    title_ar: 'مخطط للتحقق من رقم موجب أو سالب',
    title_en: 'Flowchart to check if a number is positive or negative',
    description_ar: 'بناء مخطط مع قرار',
    description_en: 'Build a flowchart with a decision',
    content: {
      instructions_ar: 'رتب العناصر لإنشاء مخطط يقرأ رقم ويحدد إذا كان موجب أو سالب',
      instructions_en: 'Arrange elements to create a flowchart that reads a number and determines if it is positive or negative',
      elements: [
        { id: 'e1', type: 'start', text_ar: 'بداية', text_en: 'Start' },
        { id: 'e2', type: 'input_output', text_ar: 'قراءة N', text_en: 'Read N' },
        { id: 'e3', type: 'decision', text_ar: 'N > 0؟', text_en: 'N > 0?' },
        { id: 'e4', type: 'input_output', text_ar: 'طباعة "موجب"', text_en: 'Print "Positive"' },
        { id: 'e5', type: 'input_output', text_ar: 'طباعة "سالب"', text_en: 'Print "Negative"' },
        { id: 'e6', type: 'end', text_ar: 'نهاية', text_en: 'End' }
      ]
    },
    correctAnswer: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6']
  },
  {
    id: 'fb-3',
    order: 9,
    type: 'flowchart_build',
    title_ar: 'مخطط التحقق من العدد الزوجي',
    title_en: 'Check if number is Even',
    description_ar: 'استخدم باقي القسمة لاتخاذ القرار',
    description_en: 'Use modulo operator for decision',
    content: {
      instructions_ar: 'رتب العناصر لإنشاء مخطط يقرأ رقم ويطبع "زوجي" إذا كان يقبل القسمة على 2، وإلا يطبع "فردي"',
      instructions_en: 'Arrange elements to create a flowchart that reads a number and prints "Even" if it is divisible by 2, otherwise prints "Odd"',
      elements: [
        { id: 'e1', type: 'start', text_ar: 'بداية', text_en: 'Start' },
        { id: 'e2', type: 'input_output', text_ar: 'قراءة X', text_en: 'Read X' },
        { id: 'e3', type: 'decision', text_ar: 'X % 2 == 0؟', text_en: 'X % 2 == 0?' },
        { id: 'e4', type: 'input_output', text_ar: 'طباعة "زوجي"', text_en: 'Print "Even"' },
        { id: 'e5', type: 'input_output', text_ar: 'طباعة "فردي"', text_en: 'Print "Odd"' },
        { id: 'e6', type: 'end', text_ar: 'نهاية', text_en: 'End' }
      ]
    },
    correctAnswer: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6']
  },
  {
    id: 'fb-4',
    order: 10,
    type: 'flowchart_build',
    title_ar: 'عملية تسجيل الدخول',
    title_en: 'Login Process',
    description_ar: 'مخطط بسيط لعملية التحقق من كلمة المرور',
    description_en: 'Simple flowchart for password verification',
    content: {
      instructions_ar: 'رتب العناصر لتمثيل عملية تسجيل دخول بسيطة تتحقق من صحة كلمة المرور',
      instructions_en: 'Arrange elements to represent a simple login process that verifies the password',
      elements: [
        { id: 'e1', type: 'start', text_ar: 'بداية', text_en: 'Start' },
        { id: 'e2', type: 'input_output', text_ar: 'إدخال كلمة المرور', text_en: 'Input Password' },
        { id: 'e3', type: 'decision', text_ar: 'هل كلمة المرور صحيحة؟', text_en: 'Is Password Correct?' },
        { id: 'e4', type: 'process', text_ar: 'منح صلاحية الوصول', text_en: 'Grant Access' },
        { id: 'e5', type: 'input_output', text_ar: 'عرض رسالة خطأ', text_en: 'Show Error' },
        { id: 'e6', type: 'end', text_ar: 'نهاية', text_en: 'End' }
      ]
    },
    correctAnswer: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6']
  },
];
