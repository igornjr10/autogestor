-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('COMPRADOR', 'VENDEDOR', 'AMBOS');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('AVISTA', 'FINANCIADO', 'PERMUTA', 'MISTO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "rg" TEXT,
    "cnh" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'COMPRADOR',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "compradorId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "observacoes" TEXT,
    "custoTotalSnapshot" DECIMAL(12,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpfCnpj_key" ON "clientes"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "vendas_veiculoId_key" ON "vendas"("veiculoId");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
