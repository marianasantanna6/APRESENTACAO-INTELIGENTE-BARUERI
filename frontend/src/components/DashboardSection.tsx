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
  type PresentationMockData,
} from "./DashboardCards";

export default function DashboardSection({
  data,
}: {
  data: PresentationMockData;
}) {
  return (
    <div className="reveal-on-scroll rounded-[14px] border border-black/5 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] p-4 sm:p-5">
      <div className="grid gap-3 xl:grid-cols-[290px_minmax(0,1fr)]">
        <div className="grid gap-3">
          <NationalIdhCard data={data} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <LifeExpectancyCard data={data} />
            <IncomePerCapitaCard data={data} />
          </div>

          <EvolutionIdhCard data={data} />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <StateDistributionCard data={data} />
            <RankingTopIdhCard data={data} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <RegionLongevityCard data={data} />
            <RegionPillarsCard data={data} />
          </div>

          <ContributionCard data={data} />
        </div>
      </div>
    </div>
  );
}
