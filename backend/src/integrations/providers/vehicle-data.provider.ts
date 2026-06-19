import { ConsultaDebitosResult, ConsultaVeiculoResult } from '../integrations.types';

/** Token de injeção para o provedor de dados veiculares (camada desacoplada). */
export const VEHICLE_DATA_PROVIDER = 'VEHICLE_DATA_PROVIDER';

/**
 * Contrato genérico de provedor de consultas veiculares.
 * Implementações: ApiBrasilProvider (e futuros provedores).
 */
export interface VehicleDataProvider {
  consultarVeiculo(placa: string): Promise<ConsultaVeiculoResult>;
  consultarDebitos(placa: string): Promise<ConsultaDebitosResult>;
}
