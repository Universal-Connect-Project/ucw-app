import { searchByText } from "@repo/utils-dev-dependency";


export const searchAndSelectFinicity = () => {
  searchByText('finbank')
  cy.findByLabelText('Add account with fin Bank').first().click()
}
