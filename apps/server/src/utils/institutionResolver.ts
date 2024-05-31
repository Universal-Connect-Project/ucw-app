import type {
  CachedInstitution,
  InstitutionProvider,
  Provider,
  ResolvedInstitution
} from '../shared/contract'
import ElasticsearchClient from './ElasticSearchClient'

export async function resolveInstitutionProvider(
  institutionId: string
): Promise<ResolvedInstitution> {
  const institution = await ElasticsearchClient.getInstitution(institutionId)
  const providers = getAvailableProviders(institution)

  let provider = providers[0]
  const institutionProvider = institution[
    provider as keyof CachedInstitution
  ] as InstitutionProvider
  if (provider === 'mx') {
    if (institution.is_test_bank) {
      provider = 'mx_int'
    }
  }
  return {
    id: institutionProvider.id,
    url: institution.url,
    name: institution.name,
    logo_url: institution.logo,
    provider: provider as Provider
  }
}

export function getAvailableProviders(
  institution: CachedInstitution
): string[] {
  const providers = []
  if (institution.mx.id != null) {
    providers.push('mx')
  }
  if (institution.sophtron.id != null) {
    providers.push('sophtron')
  }

  return providers
}
