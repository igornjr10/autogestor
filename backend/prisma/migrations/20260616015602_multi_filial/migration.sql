-- AlterTable
ALTER TABLE "lancamentos" ADD COLUMN     "filialId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "filialId" TEXT;

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "filialId" TEXT;

-- AlterTable
ALTER TABLE "vendas" ADD COLUMN     "filialId" TEXT;

-- CreateTable
CREATE TABLE "filiais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_filialId_idx" ON "lancamentos"("filialId");

-- CreateIndex
CREATE INDEX "veiculos_filialId_idx" ON "veiculos"("filialId");

-- CreateIndex
CREATE INDEX "vendas_filialId_idx" ON "vendas"("filialId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
