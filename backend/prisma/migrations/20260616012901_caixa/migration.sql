-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "formaPagamento" TEXT,
    "veiculoId" TEXT,
    "clienteId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_data_idx" ON "lancamentos"("data");

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
