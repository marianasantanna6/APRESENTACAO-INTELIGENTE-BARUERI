import { useEffect, useState } from "react";
import { presentationApi } from "../api/presentation";
import type {
  PresentationData,
  PresentationFilters,
} from "../types/presentation";

type UsePresentationDataState = {
  data: PresentationData | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Carrega os dados do dashboard/apresentacao atraves do contrato da camada de
 * API do frontend.
 *
 * As paginas devem usar este hook em vez de importar mocks diretamente, para
 * que a futura integracao com backend real fique concentrada na camada `api`.
 */
export function usePresentationData(filters: PresentationFilters) {
  const [state, setState] = useState<UsePresentationDataState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    Promise.resolve(presentationApi.getPresentationData(filters))
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setState({
          data,
          isLoading: false,
          error: null,
        });
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }

        setState({
          data: null,
          isLoading: false,
          error,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [filters.category, filters.query, filters.year]);

  return state;
}
