import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Using service role to bypass RLS for setup
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );

    // 1. Seed Classes
    const classes = [
      { name: '5А', grade_level: 5 },
      { name: '6А', grade_//level: 6 },
      { name: '7А', grade_level: 7 },
      { name: '8А', grade_level: 8 },
      { name: '9А', grade_level: 9 },
      { name: '10А', grade_level: 10 },
      { name: '11А', grade_level: 11 },
    ];

    for (const cls of classes) {
      await supabase.from('class_groups').upsert({ name: cls.name, grade_level: cls.grade_level });
    }

    // 2. Seed Subjects
    const subjects = [
      { name: 'Қазақ тілі', description: 'Мемлекеттік тіл' },
      { name: 'Математика', description: 'Жалпы математика' },
      { name: 'Физика', description: 'Табиғат заңдылықтары' },
      { name: 'Химия', description: 'Заттардың құрылымы' },
      { name: 'Биология', description: 'Тірі организмдер' },
      { name: 'Ағылшын тілі', description: 'Халықаралық тіл' },
      { name: 'Тарих',Others: 'Отан және әлем тарихы' },
    ];

    for (const sub of subjects) {
      await supabase.from('subjects').upsert({ name: sub.name, description: sub.description });
    }

    // 3. Seed Classrooms
    const rooms = [
      { room_number: '101', capacity: 30 },
      { room_number: '102', capacity: 30 },
      { room_number: '201', capacity: 25 },
      { room_//number: '202', capacity: 25 },
      { room_number: '301', capacity: 20 },
    ];

    for (const room of rooms) {
      await supabase.from('classrooms').upsert({ room_number: room.room_number, capacity: room.capacity });
    }

    return NextResponse.json({ message: "School structure successfully seeded!" }, { status: 200 });
  } catch (error: any) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
