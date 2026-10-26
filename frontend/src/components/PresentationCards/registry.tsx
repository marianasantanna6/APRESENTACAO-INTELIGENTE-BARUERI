import type { ComponentType } from "react";
import type { PresentationCardId } from "../../types/presentation";
import { ContributionPresentationCard } from "./ContributionPresentationCard";
import { EvolutionPresentationCard } from "./EvolutionPresentationCard";
import { IdhGaugeCard } from "./IdhGaugeCard";
import { LongevityPresentationCard } from "./LongevityPresentationCard";
import { MapPresentationCard } from "./MapPresentationCard";
import { NationalSummaryCard } from "./NationalSummaryCard";
import { PillarsPresentationCard } from "./PillarsPresentationCard";
import { RankingPresentationCard } from "./RankingPresentationCard";
import type { PresentationCardComponentProps } from "./types";

export const presentationCardComponents: Record<
  PresentationCardId,
  ComponentType<PresentationCardComponentProps>
> = {
  "idh-gauge": IdhGaugeCard,
  "national-summary": NationalSummaryCard,
  evolution: EvolutionPresentationCard,
  map: MapPresentationCard,
  longevity: LongevityPresentationCard,
  pillars: PillarsPresentationCard,
  contribution: ContributionPresentationCard,
  ranking: RankingPresentationCard,
};
