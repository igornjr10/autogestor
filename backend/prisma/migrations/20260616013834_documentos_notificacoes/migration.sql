-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PENDENTE', 'RECEBIDO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusNotificacao" AS ENUM ('ENVIADA', 'FALHOU', 'SIMULADA');

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "nomeArquivo" TEXT,
    "caminho" TEXT,
    "mimeType" TEXT,
    "tamanho" INTEGER,
    "observacoes" TEXT,
    "veiculoId" TEXT,
    "clienteId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "destino" TEXT,
    "mensagem" TEXT NOT NULL,
    "status" "StatusNotificacao" NOT NULL DEFAULT 'SIMULADA',
    "erro" TEXT,
    "veiculoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_criadoEm_idx" ON "notificacoes"("criadoEm");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
