import { ConsultaDocumentoResult } from '../integrations.types';

/** Token de injeção para o provedor de consulta cadastral de documentos. */
export const DOCUMENT_DATA_PROVIDER = 'DOCUMENT_DATA_PROVIDER';

/**
 * Contrato genérico de consulta cadastral de CPF/CNPJ.
 * A validação dos dígitos é feita localmente (offline); este provedor
 * traz dados cadastrais (nome/razão social, situação) quando disponível.
 */
export interface DocumentDataProvider {
  consultarDocumento(documento: string): Promise<ConsultaDocumentoResult>;
}
