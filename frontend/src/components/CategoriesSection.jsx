import SectionHeader from "./SectionHeader";
import { FaBook, FaHeartbeat, FaDollarSign } from "react-icons/fa";

const categories = [
  { title: "Educação", icon: FaBook },
  { title: "Saúde", icon: FaHeartbeat },
  { title: "Economia", icon: FaDollarSign },
];

const cardBase =
  "rounded-[16px] border border-black/5 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]";

function CategoriesSection() {
  return (
    <section
      id="sobre"
      className="bg-[linear-gradient(113.55deg,#f4f4f4_0%,#ffffff_101.25%)] px-5 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-286">
        <div className="reveal-on-scroll">
          <SectionHeader
            title="Categorias"
            description="Apresentações inteligentes para diversas áreas"
          />
        </div>

        <div className="mx-auto mt-10 grid max-w-245 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <article
                key={category.title}
                className={`reveal-on-scroll ${cardBase} flex min-h-23.25 items-center justify-center gap-3 px-6 py-5`}
                style={{ "--reveal-delay": `${index * 100}ms` }}
              >
                <Icon className="h-8 w-8 shrink-0 text-[#1675b8]" />
                <span className="text-[1.1rem] font-bold  tracking-[-0.02em] sm:text-[1.4rem]">
                  {category.title}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CategoriesSection;
