-- CreateEnum
CREATE TYPE "TipoConsulta" AS ENUM ('DADOS', 'DEBITOS');

-- CreateTable
CREATE TABLE "consultas_placa" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoConsulta" NOT NULL,
    "resultado" JSONB NOT NULL,
    "simulado" BOOLEAN NOT NULL DEFAULT false,
    "veiculoId" TEXT,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_placa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consultas_placa_placa_idx" ON "consultas_placa"("placa");

-- CreateIndex
CREATE INDEX "consultas_placa_criadoEm_idx" ON "consultas_placa"("criadoEm");

-- AddForeignKey
ALTER TABLE "consultas_placa" ADD CONSTRAINT "consultas_placa_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_placa" ADD CONSTRAINT "consultas_placa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
