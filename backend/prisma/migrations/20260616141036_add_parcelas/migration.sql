-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO');

-- CreateTable
CREATE TABLE "parcelas" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcelas_vencimento_idx" ON "parcelas"("vencimento");

-- CreateIndex
CREATE INDEX "parcelas_status_idx" ON "parcelas"("status");

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
