import { Wheat, CandyOff, Dumbbell, Zap, CircleDot } from "lucide-react"

const advantages = [
  {
    icon: Wheat,
    label: "HIGH QUALITY PROTEIN",
  },
  {
    icon: CandyOff,
    label: "NO ADDED SUGAR",
  },
  {
    icon: Dumbbell,
    label: "MUSCLE GROWTH",
  },
  {
    icon: Zap,
    label: "IMPROVED RECOVERY",
  },
  {
    icon: CircleDot,
    label: "EASY DIGESTION GAINS",
  },
]

export function StrengthAdvantage() {
  return (
    <section className="w-full  py-12  ">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-black tracking-wide text-[#2AACE2] mb-10">
          YOUR STRENGTH ADVANTAGE
        </h2>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {advantages.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#F8C89A] flex items-center justify-center">
                <item.icon className="w-8 h-8 md:w-10 md:h-10 text-zinc-800" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-bold tracking-wider text-zinc-700 text-center max-w-[100px]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
