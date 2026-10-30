"use client";

import { Sparkles, ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="text-center mb-20">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-primary/10 text-primary mb-6">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
          ҚҰПИЯЛЫЛЫҚ <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B]">
            САЯСАТЫ
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Біз сіздің деректеріңізді қорғауды және білім алу процесін қауіпсіз етуді басты мәселе деп санаймыз.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1 */}
        <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold">1</div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Деректерді жинау</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed pl-14">
            Біз тек тіркелу кезінде сіз ұсынған мәліметтерді (аты-жөні, телефон нөмірі, рөлі) жинаймыз.
            Бұл деректер тек платформаны басқару және оқу процесін бақылау үшін қолданылады.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold">2</div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Қауіпсіздік кепілдігі</h2>
          </div>
          <p className="text-muted-//foreground leading-relaxed pl-14">
            Барлық деректер Supabase-тің заманауи шифрлау жүйелерімен және Row Level Security (RLS)
            саясатымен қорғалған. Сіздің пароліңіз және жеке мәліметтеріңіз үшінші тұлғаларға берілмейді.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold">3</div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">ҰБТ материалдарын пайдалану</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed pl-14">
            ҰБТ бөліміндегі видеолар мен тесттер тек авторизациядан өткен қолданушыларға қолжетімді.
            Бұл материалдарды көшіру, тарату немесе үшінші тұлғаларға беру қатаңғана тыйым салынады.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 w-10 rounded-full gold-//gradient flex items-center justify-center text-black font-bold">4</div>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Келісім</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed pl-14">
            Тіркелу батырмасын басу арқылы сіз осы құпиялылық саясатын және мектептің ішкі ережелерін
            толықтай қабылдадыңыз деп есептелесіз.
          </p>
        </div>
      </div>

      <div className="mt-20 text-center p-12 rounded-[3rem] border-2 border-dashed border-white/10 bg-white/5">
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <p className="text-lg font-medium italic">"Біздің басты құндылығымыз — сіздің сеніміңіз және біліміңіз."</p>
        <p className="text-sm text-white/40 mt-4">© 2026 №165 МЕКТЕП. Барлық құқықтар қорғалған.</p>
      </div>
    </div>
  );
}
