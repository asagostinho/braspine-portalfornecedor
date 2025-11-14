#include "protheus.ch"
#include "restful.ch"
#INCLUDE "topconn.ch"

/*/ bp_rest_pedido_venda
API Rest referente a consulta de documentos de fornecedores

@type  WSCLASS
@author Alvaro Silvio Agostinho
@since 06/06/2024
/*/

WSRESTFUL braspine_doc_forne DESCRIPTION "Braspine - Servicos para cosnsulta de titulos e notas de fornecedores"

	WSDATA cCNPJraiz AS STRING
	WSDATA cEmpresa  AS STRING
	WSDATA cSituacao AS STRING
	WSDATA cDataIni  AS STRING
	WSDATA cDataFim  AS STRING
    WSDATA cTipo     AS STRING
	WSDATA cSenha    AS STRING

	WSMETHOD POST login DESCRIPTION "Login de fornecedor" PATH "/login"

	WSMETHOD POST cadastro DESCRIPTION "cadastro de senha de fornecedor" PATH "/cadastro"

	WSMETHOD GET docforne DESCRIPTION "Consulta titulos e notas de fornecedores" PATH "/docforne"
	
	
END WSRESTFUL


/*POST
Login do fornecedor
@type  WSMETHOD
@author Alvaro Silvio Agostinho
@since 03/06/2024   
@return lRet, logico  
*/

WSMETHOD POST login WSRECEIVE cCNPJraiz, cSenha WSSERVICE braspine_doc_forne

	local lRet			:= .F.
	local cRet			:= ''
	local cErro			:= 'Erro desconhecido'
	local oJDados		:= JSONObject():New()

	begin sequence

		::SetContentType("application/json")

		if !valConexao(Self,@cErro)
			break
		endif

		if !loginForne(Self:cCNPJraiz, Self:cSenha, @oJDados, @cErro)
			break
		endif

		cErro	:= ''
		lRet 	:= .T.

	end sequence

	if !Empty(cErro)
		SetRestFault(400,EncodeUTF8(cErro))
	else
		cRet := FwJsonSerialize(oJDados)
		::setResponse(cRet)
	endif

	FreeObj(oJDados)

return lRet

/*POST
Cadastro senha de fornecedor
@type  WSMETHOD
@author Alvaro Silvio Agostinho
@since 06/06/2024   
@return lRet, logico  
*/

WSMETHOD POST cadastro WSRECEIVE cCNPJraiz WSSERVICE braspine_doc_forne	
	local lRet			:= .F.
	local cRet			:= ''
	local cErro			:= 'Erro desconhecido'
	local oJDados		:= JSONObject():New()

	begin sequence

		::SetContentType("application/json")

		if !valConexao(Self,@cErro)
			break
		endif

		if !cadForne(Self:cCNPJraiz, @oJDados, @cErro)
			break
		endif

		cErro	:= ''
		lRet 	:= .T.

	end sequence

	if !Empty(cErro)
		SetRestFault(400,EncodeUTF8(cErro))
	else
		cRet := FwJsonSerialize(oJDados)
		::setResponse(cRet)
		::SetStatus(200)
	endif

	FreeObj(oJDados)

return lRet

/*GET 
Retorna os dados dos titulos e notas do fornecedor e programação de pagamento
@type  WSMETHOD
@author Alvaro Silvio Agostinho
@since 03/06/2024   
@return lRet, logico  
*/

WSMETHOD GET docforne WSRECEIVE cCNPJraiz, cEmpresa, cSituacao, cDataIni, cDataFim WSSERVICE braspine_doc_forne

	local lRet			:= .F.
	local cRet			:= ''
	local cErro			:= 'Erro desconhecido'
	local oJDados		:= JSONObject():New()

	begin sequence

		::SetContentType("application/json")

		if !valConexao(Self,@cErro)
			break
		endif

		if !getTitulos(Self:cCNPJraiz, Self:cEmpresa, Self:cSituacao, Self:cDataIni, Self:cDataFim, @oJDados, @cErro)
			break
		endif

		cErro	:= ''
		lRet 	:= .T.

	end sequence

	if !Empty(cErro)
		SetRestFault(400,EncodeUTF8(cErro))
	else
		cRet := FwJsonSerialize(oJDados)
		::setResponse(cRet)
	endif

	FreeObj(oJDados)

return lRet


static function loginForne(cACNPJraiz, cASenha, oAJDados, cAErro )
	
	local lOk       := .F.
	Local cQuery    := ""
	local nMaxMeses := '0'
	local nCount    := 0
  local cUserApi  := AllTrim(SuperGetMV("BP_USERAPI",, 'ALVARO.AGOSTINHO;332211'))   //usuario e senha  para gera o token de aacesso ao portal de fornecedor da braspine


	nMaxMeses := AllTrim(SuperGetMV("BP_PFPRMAX",, '0')) //Periodo maximo de intervalo de meses para filtro de data de emissão

	if Empty(cACNPJraiz)
		cAErro := EncodeUTF8('Raiz do CNPJ do fornecedor não informado')
		return .F.
	endif

	cQuery += " SELECT '02' EMP, SA2.A2_CGC CNPJ, SA2.A2_COD COD, SA2.A2_LOJA LOJA, SA2.A2_NOME NOME, SA2.A2_PASSWEB SENHA "
	cQuery += " FROM SA2020 SA2  "
	cQuery += " WHERE SUBSTRING(SA2.A2_CGC, 1, 8) = '" + AllTrim(cACNPJraiz) +"'"
	//cQuery += " AND SA2.A2_PASSWEB <> ' ' "
	cQuery += " AND SA2.D_E_L_E_T_ <> '*' "

	cQuery += " UNION "

	cQuery += " SELECT '05' EMP, SA2B.A2_CGC CNPJ,SA2B.A2_COD COD, SA2B.A2_LOJA LOJA, SA2B.A2_NOME NOME, SA2B.A2_PASSWEB SENHA "
	cQuery += " FROM SA2050 SA2B  "
	cQuery += " WHERE SUBSTRING(SA2B.A2_CGC, 1, 8) = '" + AllTrim(cACNPJraiz) +"'"
	//cQuery += " AND SA2B.A2_PASSWEB <> ' ' "
	cQuery += " AND SA2B.D_E_L_E_T_  <> '*' "

	IF Select("TA2") > 0
		DbSelectArea("TA2")
		DbCloseArea()
	ENDIF

	TCQUERY cQuery NEW ALIAS "TA2"
	
	DbSelectArea("TA2")
	TA2->(dbGoTop())

	If !TA2->(Eof())
		While !TA2->(Eof())
			if !EMPTY(TA2->SENHA)
				nCount += 1
				if ALLTRIM(TA2->SENHA) == cASenha
					oAJDados	:= JSONObject():New()

					oAJDados['cnpjraiz'] 	   := cACNPJraiz
					oAJDados['fornecedornome'] := EncodeUTF8(AllTrim(TA2->NOME))
					oAJDados['codigo']	       := TA2->COD
					oAJDados['periodomax']	   := nMaxMeses
          			
					lOk  := .T.
					exit
				endif
			endif
			TA2->(dbSkip())
		End

		if nCount <= 0
			cAErro := EncodeUTF8('Fornecedor sem senha de acesso cadastrada. Clique em Esqueceu sua senha para gerar uma senha que sera enviada por email ')
			return .F.
	
		endif
	else

		cAErro := EncodeUTF8('Fornecedor não encontrado. Verifique a raiz do CNPJ e tente novamente!')
		return .F.
	
	EndIf

	TA2->(DBCloseArea())
	

	if !lOk
		cAErro := EncodeUTF8('Senha inválida!')
		return .F.
	endif

return .T.

static function cadForne(cACNPJraiz, oAJDados, cAErro )
	local oJItens
	local aItens   := {}
	local lOk      := .F.
	Local cQuery   := ""
	local aEmail   := {}
	local cforNome := ''
    local nI       := 0
	local nNumMail := 0

	Private lAmbTeste := GETMV("MV_COMEXTE",,.F.)//.T. -> Utiliza o servidor de teste//.F. -> Utiliza o servidor de produção

	if Empty(cACNPJraiz)
		cAErro := EncodeUTF8('Raiz do CNPJ do fornecedor não informado')
		return .F.
	endif

	cQuery += " SELECT '02' EMP, SA2.A2_CGC CNPJ, SA2.A2_NOME NOME, SA2.A2_PASSWEB SENHA, SA2.A2_EMAIL EMAIL  "
	cQuery += " FROM SA2020 SA2  "
	cQuery += " WHERE SUBSTRING(SA2.A2_CGC, 1, 8) = '" + AllTrim(cACNPJraiz) +"'"
	cQuery += " AND SA2.D_E_L_E_T_  <> '*' "

	cQuery += " UNION "

	cQuery += " SELECT '05' EMP, SA2B.A2_CGC CNPJ, SA2B.A2_NOME NOME, SA2B.A2_PASSWEB SENHA, SA2B.A2_EMAIL EMAIL "
	cQuery += " FROM SA2050 SA2B  "
	cQuery += " WHERE SUBSTRING(SA2B.A2_CGC, 1, 8) = '" + AllTrim(cACNPJraiz) +"'"
	cQuery += " AND SA2B.D_E_L_E_T_  <> '*' "

	IF Select("TA2") > 0
		DbSelectArea("TA2")
		DbCloseArea()
	ENDIF

	TCQUERY cQuery NEW ALIAS "TA2"
	
	DbSelectArea("TA2")
	TA2->(dbGoTop())

	If !TA2->(Eof())
		While !TA2->(Eof())
			// if !EMPTY(TA2->SENHA)
			// 	cAErro := EncodeUTF8('O Fornecedor ja possui senha cadastrada. Entre em contato com departamento financeiro')
			// 	return .F.
			// endif
			if !EMPTY(TA2->EMAIL)
				aAdd(aEmail, AllTrim(TA2->EMAIL))
				cForNome := TA2->NOME

				//Alteração para envair email quado ja passui senha  - Alvaro Silvio Agostinho 11/09/2024
				cSenha := TA2->SENHA				

			endif
			TA2->(dbSkip())
		End
	else
		cAErro := EncodeUTF8('O Fornecedor não encontrado. Entre em contato com departamento financeiro')
		return .F.
	EndIf

	TA2->(DBCloseArea())
	

	if LEN(aEmail) <= 0
		cAErro := EncodeUTF8('Fornecedor não possui email cadastrado. Entre em contato com departamento financeiro')
		return .F.
	else

		if EMPTY(AllTrim(cSenha))  //Alteração para envair email quado ja passui senha  - Alvaro Silvio Agostinho 11/09/2024

			cSenha := gerarSenha(cACNPJraiz, cForNome)

			if !EMPTY(cSenha)
				if updateFor( cACNPJraiz, cSenha)
					for nI := 1 to LEN(aEmail)
						lOk := envEmail( aEmail[nI], cACNPJraiz, cForNome, cSenha)
						if lOk
							nNumMail += 1
						endif
					next
				else
					cAErro := 'Erro ao atualizar a senha do fornecedor'
					return .F.
				endif
			else
				cAErro := 'Erro ao gerar a senha do fornecedor'
				return .F.
			endif

		else
			//Alteração para envair email quado ja passui senha  - Alvaro Silvio Agostinho 11/09/2024
			for nI := 1 to LEN(aEmail)
				lOk := envEmail( aEmail[nI], cACNPJraiz, cForNome, cSenha)
				if lOk
					nNumMail += 1
				endif
			next

		endif

	endif

	if nNumMail > 0
		oJItens		:= JSONObject():New()
		oAJDados['cnpjraiz'] 	    := cACNPJraiz
		oAJDados['fornecedornome']	:= cForNome
		oAJDados['listemail']	:= {}

		for ni := 1 to LEN(aEmail)
			oJItens		:= JSONObject():New()
			oJItens['email'] := aEmail[1]
			aAdd(aItens,oJItens)
		next

		oAJDados['listemail'] := aItens

	endif

return .T.


//***************************************************************************//

static function getTitulos(cACNPJraiz, cAEmpresa, cASituacao, cADataIni, cADataFim, oAJDados, cAErro)
                          
	local oJItens
	local aItens	:= {}
	local aEmpresa  := FWLoadSM0()
	local nI        := 0
	local cFiliais  := ' '
	local cQuery    := ' '
	local cTipoTit  := AllTrim(SuperGetMV("BP_TPLTFOR",,"NF;INV;PA;FT")) //Tipo de titulos a listar
	local cFilBP    := ' '
	local cFilBL    := ' '
	local cFILFL    := ' '
	// local dDataIni  := CtoD('')
	// local dDataFim  := CtoD('')
	
	if Empty(cADataIni) .OR. Empty(cADataFim)
		cAErro := EncodeUTF8('Obrigatório informar a data de emissão inicial e final')
		return .F.
	endif

	if Empty(cACNPJraiz)
		cAErro := EncodeUTF8('Raiz do CNPJ do fornecedor não informado')
		return .F.
	endif

	if len(aEmpresa) > 0
		for nI := 1 to len(aEmpresa)
			if EMPTY(cAEmpresa)
				//Rais de CNPJ   01203549 - BRASPINE, 05265768 - BRASLUMBER, 40220649 - BRASFOREST
				if SUBSTR(aEmpresa[nI,18], 1, 8 ) $ '01203549|05265768|40220649'
					if !EMPTY(cFiliais)
						cFiliais += '|'
					endif 
					cFiliais += aEmpresa[nI,2]

					if SUBSTR(aEmpresa[nI,18], 1, 8 ) == '01203549'  //BRASPINE
						if !Empty(cFilBP) 
							cFilBP += '|'
						endif
						cFilBP += aEmpresa[nI,2]
					elseif SUBSTR(aEmpresa[nI,18], 1, 8 ) == '05265768' //BRASLUMBER
						if !Empty(cFilBL) 
							cFilBL += '|'
						endif
						cFilBL += aEmpresa[nI,2]
					elseif SUBSTR(aEmpresa[nI,18], 1, 8 ) == '40220649'  //BRASFOREST
						if !Empty(cFilFL) 
							cFilFL += '|'
						endif
						cFilFL += aEmpresa[nI,2]
					endif

				EndIF
			else
				if SUBSTR(aEmpresa[nI,18], 1, 8 ) $ Trim(cAEmpresa)
					if !EMPTY(cFiliais)
						cFiliais += '|'
					endif 

					cFiliais += aEmpresa[nI,2]

					if cAEmpresa == '01203549'  //BRASPINE
						if !Empty(cFilBP) 
							cFilBP += '|'
						endif
						cFilBP += aEmpresa[nI,2]
					elseif cAEmpresa == '05265768' //BRASLUMBER
						if !Empty(cFilBL) 
							cFilBL += '|'
						endif
						cFilBL += aEmpresa[nI,2]
					elseif cAEmpresa == '40220649'  //BRASFOREST
						if !Empty(cFilFL) 
							cFilFL += '|'
						endif
						cFilFL += aEmpresa[nI,2]
					endif
				EndIF
			endif

		next nx
	endif

	//Query  para buscar titulos no grupo de empres 02 e 05
	cQuery := " SELECT SE2.E2_FILIAL EMPRESA, SA2.A2_CGC CNPJ, SA2.A2_NOME NOME, SE2.E2_NUM NUMDOC, SE2.E2_PARCELA PARCELA, SE2.E2_EMISSAO EMISSAO, "
	cQuery += " SE2.E2_VALOR VALOR, SE2.E2_SALDO SALDO, SE2.E2_VENCREA VENCIMENTO, SE2.E2_TIPO TIPO, SE2.E2_PREFIXO PREFIXO, SE2.E2_XNRINVO INVOICE, SW9.W9_INVOICE INVOICEEIC""
	cQuery += " FROM SE2020 SE2 "

	cQuery += " INNER JOIN  SA2020 SA2 "
	cQuery += " ON SA2.A2_COD = SE2.E2_FORNECE "
	cQuery += " AND SA2.A2_LOJA = SE2.E2_LOJA "
	cQuery += " AND SUBSTRING(SA2.A2_CGC, 1, 8) = '" + cACNPJraiz + "' "
	cQuery += " AND SA2.D_E_L_E_T_ <> '*' "

	cQuery += " LEFT JOIN SW9020 SW9 "
	cQuery += " ON  SW9.W9_FILIAL = SE2.E2_FILIAL "
	cQuery += " AND SW9.W9_NUM = SE2.E2_NUM "
	cQuery += " AND SW9.W9_HAWB = SE2.E2_HAWBEIC "
	cQuery += " AND SW9.D_E_L_E_T_ <> '*'  "
	
	cQuery += " WHERE SE2.E2_FILIAL IN " + FormatIn(cFiliais,"|") 
	cQuery += " AND SE2.E2_TIPO IN " + FormatIn(cTipoTit, ";")
	cQuery += " AND SE2.E2_EMISSAO BETWEEN '" + cADataIni + "' AND '" + cADataFim + "'"
	cQuery += " AND SE2.D_E_L_E_T_ <> '*' "

	if UPPER(Alltrim(cASituacao)) == 'ABERTO'
		cQuery += " AND SE2.E2_SALDO > 0 "
	endif
	if UPPER(Alltrim(cASituacao)) == 'PAGO'
		cQuery += " AND SE2.E2_SALDO <= 0 "
	endif

	cQuery += " UNION "

	cQuery += " SELECT SE2B.E2_FILIAL EMPRESA, SA2B.A2_CGC CNPJ, SA2B.A2_NOME NOME, SE2B.E2_NUM NUMDOC, SE2B.E2_PARCELA PARCELA, SE2B.E2_EMISSAO EMISSAO, "
	cQuery += " SE2B.E2_VALOR VALOR, SE2B.E2_SALDO SALDO, SE2B.E2_VENCREA VENCIMENTO, SE2B.E2_TIPO TIPO, SE2B.E2_PREFIXO PREFIXO, SE2B.E2_XNRINVO INVOICE, SW9B.W9_INVOICE INVOICEEIC"
	
	cQuery += " FROM SE2050 SE2B "

	cQuery += " INNER JOIN  SA2050 SA2B  "
	cQuery += " ON SA2B.A2_COD = SE2B.E2_FORNECE "
	cQuery += " AND SA2B.A2_LOJA = SE2B.E2_LOJA "
	cQuery += " AND SUBSTRING(SA2B.A2_CGC, 1, 8) = '" + cACNPJraiz + "' "
	cQuery += " AND SA2B.D_E_L_E_T_ <> '*' "

	cQuery += " LEFT JOIN SW9050 SW9B "
	cQuery += " ON  SW9B.W9_FILIAL = SE2B.E2_FILIAL "
	cQuery += " AND SW9B.W9_NUM = SE2B.E2_NUM "
	cQuery += " AND SW9B.W9_HAWB = SE2B.E2_HAWBEIC "
	cQuery += " AND SW9B.D_E_L_E_T_ <> '*' "

	cQuery += " WHERE SE2B.E2_FILIAL IN " + FormatIn(cFiliais,"|") 
	cQuery += " AND SE2B.E2_TIPO IN " + FormatIn(cTipoTit, ";")
	cQuery += " AND SE2B.E2_EMISSAO BETWEEN '" + cADataIni + "' AND '" + cADataFim + "'"
	cQuery += " AND SE2B.D_E_L_E_T_ <> '*' "
	
	if UPPER(Alltrim(cASituacao)) == 'ABERTO'
		cQuery += " AND SE2B.E2_SALDO > 0 "
	endif
	if UPPER(Alltrim(cASituacao)) == 'PAGO'
		cQuery += " AND SE2B.E2_SALDO <= 0 "
	endif

	cQuery += " ORDER BY EMISSAO "

	IF Select("TE2") > 0
		DbSelectArea("TE2")
		DbCloseArea()
	ENDIF

	TCQUERY cQuery NEW ALIAS "TE2"

	DbSelectArea("TE2")
	TE2->(dbGoTop())

	oAJDados := JSONObject():New()
	oAJDados['cnpjraiz'] 	    := cACNPJraiz
	oAJDados['fornecedornome']	:= TE2->NOME
	oAJDados['titulos']	        := {}  

	If !TE2->(Eof())

		While !TE2->(Eof())
			
			oJItens		:= JSONObject():New()

			if TE2->EMPRESA $ cFILBP
				oJItens['empresa']	:= 'BRASPINE'
			elseif TE2->EMPRESA  $ cFILBL
				oJItens['empresa']	:= 'BRASLUMBER'
			elseif  TE2->EMPRESA  $ cFILFL
				oJItens['empresa']	:= 'BRASFOREST'				
			endif
		
			oJItens['cnpj']		   := TE2->CNPJ
			oJItens['documento']   := IIF(TE2->PREFIXO $ 'EEC/EIC', IIF( AllTrim(TE2->PREFIXO) == 'EIC', TE2->INVOICEEIC, TE2->INVOICE ), TE2->NUMDOC)
			oJItens['parcela']	   := TE2->PARCELA
			oJItens['emissao']     := FormDate(StoD(TE2->EMISSAO), .T.)
			oJItens['valor']	   := Alltrim(Transform(TE2->VALOR,"@E 99,999,999.99"))
			oJItens['situacao']	   := IIF(TE2->SALDO > 0, "ABERTO", "PAGO" )
			oJItens['programacao'] := FormDate(StoD(TE2->VENCIMENTO), .T.)
		
			aAdd(aItens,oJItens)


			TE2->(dbSkip())
		End

		oAJDados['titulos'] := aItens
	
	EndIf


return .T.



//***************************************************************************//

static function valConexao(oASelf,cAErro)

	local lRet          := .F.
	local aGruEmpFil    := {}

	begin sequence

		if Empty(oASelf:GetHeader('tenantid'))
			cAErro := EncodeUTF8('tenantId não informado')
			break
		endif

		aGruEmpFil := Separa(oASelf:GetHeader('tenantid'),',',.T.)
		if Len(aGruEmpFil) <> 2 .OR. Empty(aGruEmpFil[1]) .OR. Empty(aGruEmpFil[2])
			cAErro := 'tenantId incorreto'
			break
		endif

		if AllTrim(aGruEmpFil[1]) <> AllTrim(cEmpAnt)
			cAErro := 'Grupo de empresas informado diferente do grupo de empresas parametrizado'
			break
		endif

		if AllTrim(aGruEmpFil[2]) <> AllTrim(cFilAnt)
			cAErro := 'Filial informada diferente da filial parametrizada'
			break
		endif

		if !FWFilExist(aGruEmpFil[1],aGruEmpFil[2])
			cAErro := EncodeUTF8('Grupo de empresas e filial não cadastrado')
			break
		endif

		lRet := .T.

	end sequence

return lRet

//***************************************************************************//

static function updateFor( cCNPJ, cSenha)
	local cQryUpd := ''
	local lOk     := .F.	
	local nI      := 0

	For nI := 1 to 2
		if nI == 1
			cQryUpd := " UPDATE SA2020 "   //update fornecedor grupo de empresa 02
		else
			cQryUpd := " UPDATE SA2050 "   //update fornecedor grupo de empresa 05
		endif

		cQryUpd += " SET A2_PASSWEB = '" + AllTrim(cSenha) + "'"
		cQryUpd += " WHERE SUBSTRING(A2_CGC, 1, 8) = '" + AllTrim(cCNPJ) +"'"
		cQryUpd += " AND D_E_L_E_T_ <> '*' "

		//executar o update
		If TcSqlExec(cQryUpd) < 0
			//MsgStop("Erro na execução da query: "+TcSqlError(), "Atenção")
			lOk := .T.
		else
			lOk := .T.
		EndIf    
	next 

return lOk

return .T.


static function envEmail( cEmail, cCNPJ, cForNome, cSenha)
	
    Local cTo         := ''
    Local cFrom       := 'protheus@braspine.com.br'
    Local cCC         := ''
    Local cCCO        := ''
    Local cTIT        := ' '//Titulo do e-mail 
    Local cTXT        := '' // HTML do email a ser enviado
    Local aANX        := ''
    Local cMSG        := ''
    Local lPSchd      := .F.
    Local lDelArq     := .F.
    
	cTo   := Alltrim(cEmail)
	cFrom := 'protheus@braspine.com.br'
	cTIT  := 'Dados de acesso ao portal de fornecedor da Brapine'

	if !Empty(cTo)

		cTXT += "<HTML>"
		cTXT += "<Body>"
		cTXT += "<p>Prezado " + AllTRim(cForNome) + ", segue os dados de acesso do portal de consulta de documentos do fornecedor da Braspine"
		cTXt += "</br>"
		cTXT += "Seu usuário de acesso sera a raiz do seu CNPJ </br>"
		cTXT += "Usuario: " + AllTrim(cCNPJ) + "</br>"
		cTXT += "Senha: " + Alltrim(cSenha) + "</br>"
		cTXt += "</br>"
		cTXT += "</Body>"
		cTXT += "</HTML>"

		if lAmbTeste 
			cTXT+="<p>E-mail seria enviado para o fornecedor:"+cTo+"</p>" 
		EndIF
		
		U_BPSENDM(cFROM,cTO,cCC,cCCO,cTIT,cTXT,aANX,cMSG,lPSchd,lDelArq)
	
	EndIF 

return .T.


//***************************************************************************//
static function gerarSenha(cANum, cAchar)
	local cPasswd := ' '
	local cChrEsp := ' '
	local cChar   := ' '
	local cNum    := ' '

	cNum    := SubStr(cANum, 1,2) + SubStr(cANum, 6,2)
	cChrEsp := '@$'
	cChar   := StrTran(cAchar, "&", "")
	cChar   := StrTran(cChar , "%", "")
	cChar   := StrTran(cChar , " ", "")
	cChar   := LOWER(SubStr(cChar, 1,3)) + UPPER(SubStr(cChar, 4,3))

	cPasswd := cChar + cNum + cChrEsp
	cPasswd := EMBARALHA( cPasswd, 0 )
	cPasswd := SubStr(cPasswd, 1, 10)

return cPasswd

user function ZtesAPI1

	local oJDados	:= JSONObject():New()
	local cJSON
	local cErro     := ' '

	RPCSetEnv("02", '020201', Nil, Nil, Nil, GetEnvServer())

	// if loginForne('08349614', @oJDados, @cErro )
		
	// 	cJSON := FwJsonSerialize(oJDados)

	// 	MemoWrite('c:\temp\login_advpl.json', cJSON)
				
	// endif

	// if cadForne('08349614', @oJDados, @cErro )
		
	// 	cJSON := FwJsonSerialize(oJDados)

	// 	MemoWrite('c:\temp\login_advpl.json', cJSON)
				
	// endif

	if getTitulos('80827462' , '', '', '20240801', '20240830',@oJDados, cErro)

		cJSON := FwJsonSerialize(oJDados)

		MemoWrite('c:\temp\titulo_advpl.json', cJSON)

	endif

	FreeObj(oJDados)

	RPCClearEnv()

return

