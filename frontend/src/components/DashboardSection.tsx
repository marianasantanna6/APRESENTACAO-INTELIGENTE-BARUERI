import {
  ContributionCard,
  EvolutionIdhCard,
  IncomePerCapitaCard,
  LifeExpectancyCard,
  NationalIdhCard,
  RankingTopIdhCard,
  RegionLongevityCard,
  RegionPillarsCard,
  StateDistributionCard,
  type PresentationCardId,
  type PresentationMockData,
} from "./DashboardCards";

export default function DashboardSection({
  data,
  onOpenSlide,
}: {
  data: PresentationMockData;
  onOpenSlide?: (slideId: PresentationCardId) => void;
}) {
  return (
    <div
      data-dashboard-surface="shell"
      className="reveal-on-scroll rounded-[14px] border border-black/5 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.12)] sm:p-5"
    >
      <div className="grid gap-3 xl:grid-cols-[290px_minmax(0,1fr)]">
        <div className="grid gap-3">
          <NationalIdhCard data={data} onOpenSlide={onOpenSlide} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <LifeExpectancyCard data={data} onOpenSlide={onOpenSlide} />
            <IncomePerCapitaCard data={data} onOpenSlide={onOpenSlide} />
          </div>

          <EvolutionIdhCard data={data} onOpenSlide={onOpenSlide} />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <StateDistributionCard data={data} onOpenSlide={onOpenSlide} />
            <RankingTopIdhCard data={data} onOpenSlide={onOpenSlide} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <RegionLongevityCard data={data} onOpenSlide={onOpenSlide} />
            <RegionPillarsCard data={data} onOpenSlide={onOpenSlide} />
          </div>

          <ContributionCard data={data} onOpenSlide={onOpenSlide} />
        </div>
      </div>
    </div>
  );
}
