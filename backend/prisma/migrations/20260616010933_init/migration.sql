-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'VENDEDOR', 'FINANCEIRO', 'DOCUMENTAL');

-- CreateEnum
CREATE TYPE "Combustivel" AS ENUM ('FLEX', 'GASOLINA', 'DIESEL', 'ELETRICO', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "SituacaoVeiculo" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'VENDEDOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "renavam" TEXT NOT NULL,
    "chassi" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anoFabricacao" INTEGER NOT NULL,
    "anoModelo" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "combustivel" "Combustivel" NOT NULL,
    "quilometragem" INTEGER NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "valorCompra" DECIMAL(12,2) NOT NULL,
    "valorVendaSugerido" DECIMAL(12,2),
    "situacao" "SituacaoVeiculo" NOT NULL DEFAULT 'DISPONIVEL',
    "observacoes" TEXT,
    "propNome" TEXT NOT NULL,
    "propCpfCnpj" TEXT NOT NULL,
    "propTelefone" TEXT,
    "propEndereco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos_adicionais" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custos_adicionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_chassi_key" ON "veiculos"("chassi");

-- AddForeignKey
ALTER TABLE "custos_adicionais" ADD CONSTRAINT "custos_adicionais_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
