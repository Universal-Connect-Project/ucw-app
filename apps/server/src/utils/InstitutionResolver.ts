import type { InstitutionProvider, LocalInstitution, Provider, ResolvedInstitution } from '../shared/contract'
import ElasticsearchClient from './ElasticSearchClient'

export async function resolveInstitutionProvider (institutionId: string): Promise<ResolvedInstitution> {
  const institution = await ElasticsearchClient.getInstitution(institutionId)
  const providers = availableProviders(institution)

  if (providers.length === 1) {
    let provider = providers[0]
    const institutionProvider = institution[provider as keyof LocalInstitution] as InstitutionProvider
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
  } else {
    // default to MX for now until further logic is added
    return {
      id: institution.mx.id,
      url: institution.url,
      name: institution.name,
      logo_url: institution.logo,
      provider: institution.is_test_bank ? 'mx_int' : 'mx'
    }
  }
}

function availableProviders (institution: LocalInstitution): string[] {
  const providers = []
  if (institution.mx.id != null) {
    providers.push('mx')
  }
  if (institution.sophtron.id != null) {
    providers.push('sophtron')
  }
  if (institution.finicity.id != null) {
    providers.push('finicity')
  }
  if (institution.akoya.id != null) {
    providers.push('akoya')
  }
  return providers
}
