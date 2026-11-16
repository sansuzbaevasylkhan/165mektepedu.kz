const MAP: [RegExp, string][] = [
  [/BLOCKED/, 'Аккаунт бұғатталған. Мектеп әкімшілігіне хабарласыңыз.'],
  [/LESSON_LOCKED/, 'Бұл сабақ әлі жабық. Алдыңғы сабақты толық аяқтаңыз.'],
  [/VIDEO_NOT_COMPLETED/, 'Алдымен видеосабақты соңына дейін көріңіз.'],
  [/TOO_FAST/, 'Тым жиі әрекет. Бірнеше секундтан кейін қайталаңыз.'],
  [/EMPTY_TEST/, 'Бұл тестте сұрақтар жоқ.'],
  [/STUDENT_NOT_FOUND/, 'Мұндай нөмірмен оқушы табылмады.'],
  [/INVALID_PHONE/, 'Телефон нөмірі дұрыс емес.'],
  [/NEED_TWO_OPTIONS/, 'Кемінде 2 жауап нұсқасы болуы керек.'],
  [/NEED_ONE_CORRECT/, 'Дәл бір дұрыс жауап белгілеңіз.'],
  [/EMPTY_QUESTION/, 'Сұрақ мәтінін енгізіңіз.'],
  [/FORBIDDEN/, 'Бұл әрекетке рұқсатыңыз жоқ.'],
  [/NOT_FOUND/, 'Мәлімет табылмады.'],
  [/Invalid login credentials/i, 'Телефон нөмірі немесе құпиясөз қате.'],
  [/User already registered|already been registered|duplicate key|profiles_phone_key/i, 'Бұл телефон нөмірімен тіркелу бұрын жасалған.'],
  [/Database error saving new user/i, 'Тіркелу мүмкін болмады. Деректерді тексеріңіз немесе нөмір бұрын тіркелген.'],
  [/Failed to fetch|NetworkError|network/i, 'Желі байланысы жоқ. Интернетті тексеріңіз.'],
  [/row-level security|permission denied/i, 'Бұл әрекетке рұқсатыңыз жоқ.'],
  [/Password should be at least/i, 'Құпиясөз тым қысқа.'],
];

export function friendlyError(e: unknown): string {
  const msg =
    typeof e === 'string' ? e : e instanceof Error ? e.message : (e as { message?: string })?.message ?? '';
  for (const [re, text] of MAP) if (re.test(msg)) return text;
  return 'Қате пайда болды. Кейінірек қайталап көріңіз.';
}
