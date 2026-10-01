import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl font-extrabold md:text-6xl mb-6">№165 Мектеп</h1>
        <div className="h-1.5 w-24 bg-primary rounded-full mb-8" />
        <p className="max-w-3xl text-lg text-muted-foreground md:text-xl leading-relaxed">
          №165 мектеп — оқушыларға сапалы білім беруге, олардың шығармашылық және интеллектуалдық қабілеттерін дамытуға бағытталған білім беру ортасы.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Біздің мақсатымыз</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Мектептің негізгі мақсаты — оқушыларға қауіпсіз, заманауи және қолайлы білім беру ортасын қалыптастыру. Оқушылардың білімін арттырып, болашақ мамандығын саналы түрде таңдауына және қоғамға пайдалы тұлға болып қалыптасуына жағдай жасау.
          </p>
        </div>
        <div className="bg-muted rounded-3xl h-64 md:h-96 flex items-center justify-center text-muted-foreground italic">
          [Мектеп суреті осында орналасады]
        </div>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Біздің құндылықтарымыз</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[
          "Сапалы білім",
          "Жауапкершілік",
          "Тәртіп",
          "Шығармашылық",
          "Заманауи технология",
          "Өзара құрмет",
          "Оқушының жеке дамуы"
        ].map((value, idx) => (
          <div key={idx} className="p-6 rounded-2xl border bg-background hover:border-primary transition-colors text-center font-semibold text-lg">
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}
