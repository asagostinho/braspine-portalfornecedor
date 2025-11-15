import { Component, Input, ViewChild } from '@angular/core';
import { PoButtonGroupItem, PoDatepickerComponent, PoNotificationService, PoSelectOption, PoTableColumn } from '@po-ui/ng-components';
import { TitulosService } from '../services/titulos.service';
import * as XLS from 'xlsx';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;


@Component({
  selector: 'app-titulos',
  templateUrl: './titulos.component.html',
  styleUrls: ['./titulos.component.css'],
  providers: [PoNotificationService]})
export class TitulosComponent {
  @Input() cnpj: string = '';
  @Input() maxperiodo: string = '';
  @Input() fornecedornome: string = '';
  //@ViewChild('datepicker', { static: true }) datepickerComponent: PoDatepickerComponent | undefined;


  public empresa: string = ' ';
  public situacao: string = ' ';
  public dataAux = new Date()
  public dataIni:string  = <any>new Date(this.dataAux.setDate(this.dataAux.getDate() - 30 ))
  public dataFim: string = <any>new Date()
  public itens: Array<any> = [];
  public isHideLoading = true ;
  public url: string = ''
  public data: any;

  lok: boolean = true;

  readonly empresaOptions: Array<PoSelectOption> = [
    { label: '01203549 - BRASPINE', value: '01203549' },
    { label: '05265768 - BRASLUMBER', value: '05265768' },
    { label: '40220649 - BRASFOREST', value: '40220649' },
    { label: 'Todas', value: ' ' }
  ];

  readonly situacaoOptions: Array<PoSelectOption> = [
    { label: 'Abertos', value: 'ABERTO' },
    { label: 'Pagos', value: 'PAGO' },
    { label: 'Todos', value: ' ' }
  ];

  botoes: Array<PoButtonGroupItem> = [
       {  icon: 'po-icon po-icon-pdf', action: this.exportToPDF.bind(this) , tooltip: 'Exportar para PDF' },
       {  icon: 'po-icon po-icon-doc-xls', action: this.exportToExcel.bind(this) , tooltip: 'Exportar para EXCEL' }
   ];

  constructor(private msg: PoNotificationService, private service: TitulosService) {}



  public onClick(){

    var dataI: Date;
    var dataF: Date;
    var maxdias = parseInt(this.maxperiodo.trim()) * 30;

    this.lok = true;

    if (!this.dataIni ){
      this.msg.error('Abrigatório informar data inicial e data final');
      this.lok = false;
    }else if(!this.dataFim){
      this.msg.error('Abrigatório informar data inicial e data final');
      this.lok = false;
    }else{

        dataI = this.getDataValida(this.dataIni);
        dataF = this.getDataValida(this.dataFim);

        if (dataI.getTime() > dataF.getTime()) {

          this.msg.error('Data inicial deve ser menor ou igual a data final');
          this.lok = false;


        }else{

          var periodo = dataF.getTime() - dataI.getTime() ;
          periodo = periodo / (1000 * 60 * 60 * 24)  //converte milesegundos em dias

          if ( periodo > maxdias){
            this.msg.error(`O Periodo informado execede ao periodo maximo de ${this.maxperiodo.trim()} meses`);
            this.lok = false;
          }
        }

    }

    if (this.lok ) {

    this.isHideLoading = false;
    var dataStrI = this.dataIni.replace(/-/g,"");
    var dataStrF = this.dataFim.replace(/-/g,"");

    this.service.buscarTitulo( this.cnpj, this.empresa, this.situacao, dataStrI , dataStrF).subscribe(
        (response:  any) => {
          // Processar a resposta do Webservice\
          this.itens = response.titulos;
          this.data =  response.titulos;

          this.isHideLoading = true;
          // if (this.itens.length == 0){
          //   this.msg.information("Nenhum documento encontrado com os filtros informados!")
          // }

        },
        (error: any) => {
          if (error.message){
            this.msg.error(error.message)
          }
          this.itens = [];
          this.data = [];
          this.isHideLoading = true;

        }
      );

    }



  }


  exportar(){

  }


  setEmpresa(event: any) {
      this.empresa! = event

   }

   setSituacao(event: any) {
    this.situacao! = event

   }


  setDataIni(event: any) {
    if (event){
      this.dataIni = event
    }
   }

  setDataFim(event: any) {
    if (event){
      this.dataFim = event
    }
  }

  formatDataYYYYMMDD(dataIn: Date){
    var yyyy ;
    var mm ;
    var dd ;
    var ret = ' ';
    var data = new Date(dataIn);
    yyyy = data.getFullYear();
    mm = ( data.getMonth() + 101);
    dd = (data.getDay() + 100)
    ret = yyyy.toString() + mm.toString().substring(1) + dd.toString().substring(1);

    return ret
  }

  getDataValida(strData: String){
    let itemData = strData.split('-')
    return new Date(parseInt(itemData[0]),parseInt(itemData[1])-1,parseInt(itemData[2]));
  }



  public exportToExcel(): void {

    if (this.data){
      const columns = this.getColumns(this.data);
      const worksheet = XLS.utils.json_to_sheet(this.data, { header: columns });
      const workbook = XLS.utils.book_new();
      XLS.utils.book_append_sheet(workbook, worksheet, 'Documentos');
      XLS.writeFile(workbook, 'doc_fornecedor.xlsx');
      this.msg.success("Download realizado com sucesso!")
    }else{
      this.msg.error("Não existe dados para exportar!")
    }
  }

  getColumns(data: any[]): string[] {
    const columns: string[] = [];
    data.forEach(row => {
      Object.keys(row).forEach(col => {
        if (!columns.includes(col)) {
          columns.push(col);
        }
      });
    });
    return columns;
  }

  public async exportToPDF(): Promise<void> {

    if (this.data){
      const  tituloColun =  [  { text: 'Empresa', style: 'tableHeader'},
                            { text: 'CNPJ', style: 'tableHeader'},
                            { text: 'Documento', style: 'tableHeader'},
                            { text: 'Parcela', style: 'tableHeader'},
                            { text: 'Emissão', style: 'tableHeader'},
                            { text: 'Valor', style: 'tableHeader'},
                            { text: 'Situacão', style: 'tableHeader'},
                            { text: 'Programação', style: 'tableHeader'}
                            ]

      const columns = Object.keys(this.data[0]); // Get the column names from the first object in the array
      const headers = columns.map((column) => ({ text: column.trim(), style: 'tableHeader', upper: true })); // Generate header cells for each column

      const rows = this.data.flatMap((titulos: any) => {
        const cells = columns.map((column) => ({ text: (titulos[column]) })); // Generate cells for each row based on the column names

        return [...[cells]]; // Merge cells and order cells into a single array
      });

      const empresaF = this.empresa == '01203549' ? 'BRASPINE' : ( this.empresa == '05265768' ? 'BRASLUMBER' : (this.empresa == '40220649' ? 'BRASFOREST' : 'TODAS' ));
      const situacaoF = this.situacao == 'ABERTO' ? 'ABERTO' : ( this.situacao == 'PAGO' ? 'PAGO' : 'TODOS' );
      const dataIniF = `${this.dataIni.substring(8)}/${this.dataIni.substring(5,7)}/${this.dataIni.substring(0,4)}`;
      const dataFimF = `${this.dataFim.substring(8)}/${this.dataFim.substring(5,7)}/${this.dataFim.substring(0,4)}`;

      const docDefinition: any = {
        content: [
          {
            image: await this.getBase64ImageFromURL('../../assets/logo_braspine.png'),
            width: 104,
            height: 20,
          },
          {

            text: `Consulta Documentos do Fornecedor ${this.fornecedornome}`,
            style: 'header',
          },
          {
          text: `Empresa: ${empresaF}     Situação: ${situacaoF}     Periodo de ${dataIniF} a ${dataFimF}`,
          style: 'header'
          },
          {
            style: 'table1',

            table: {
              headerRows: 1,
              //widths: headers.map(() => '*'),
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
              //body: [headers, ...rows],
              body: [tituloColun, ...rows],
            },
          },
        ],
        styles: {
          header: {
            fontSize: 10,
            bold: true,
            margin: [0, 0, 0, 5],
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'black',
          },
          table1: {
            fontSize: 10,
            margin: [0, 0, 0, 5],
          },
        },
      };


      pdfMake.createPdf(docDefinition).download('userdata.pdf');

    }else{
      this.msg.error("Não existe dados para exportar!")
    }

   }

   getBase64ImageFromURL(url: string) {
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.setAttribute("crossOrigin", "anonymous");

      img.onload = () => {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx!.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL("image/png");

        resolve(dataURL);
      };

      img.onerror = error => {
        reject(error);
      };

      img.src = url;
    });

  }

  // public exportToPDF(): void{

  //   const docDefinition: any = {
  //     content: [
  //       {
  //         text: 'Consulta Documentos do Fornecedor R & S FLORESTAL LTDA',
  //         style: 'subheader',
  //       },
  //       'Empresa: Todas   Situação: Todas Periodo de 01/04/2024 a 11/06/2024',
  //       {
  //         style: 'tableExample',
  //         table: {
  //           body: [
  //             [
  //               'Empresa',
  //               'CNPJ',
  //               'Documento',
  //               'Parcela',
  //               'Emissão',
  //               'Valor',
  //               'Situacão',
  //               'Programação',
  //             ],
  //             [
  //               'BRASPINE',
  //               '08349614000195',
  //               '000001790',
  //               '',
  //               '10/04/2024',
  //               '48.663,12',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //             [
  //               'BRASLUMBER',
  //               '08349614000195',
  //               '000001790',
  //               '',
  //               '10/04/2024',
  //               '48.663,12',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //             [
  //               'BRASLUMBER',
  //               '08349614000195',
  //               '000027938',
  //               '',
  //               '10/04/2024',
  //               '48.663,12',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //             [
  //               'BRASLUMBER',
  //               '08349614000195',
  //               '000027938',
  //               '',
  //               '10/04/2024',
  //               '48.663,12',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //             [
  //               'BRASPINE',
  //               '08349614000195',
  //               '000001790',
  //               '',
  //               '10/04/2024',
  //               '5.951,40',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //             [
  //               'BRASFLOREST',
  //               '08349614000195',
  //               '000001790',
  //               '',
  //               '10/04/2024',
  //               'R$ 5.951,40',
  //               'PAGO',
  //               '10/04/2024',
  //             ],
  //           ],
  //         },
  //       },
  //     ],

  //     styles: {
  //       header: {
  //         fontSize: 18,
  //         bold: true,
  //         margin: [0, 0, 0, 10],
  //       },
  //       subheader: {
  //         fontSize: 12,
  //         bold: true,
  //         margin: [0, 10, 0, 5],
  //       },
  //       tableExample: {
  //         fontSize: 10,
  //         margin: [0, 5, 0, 15],
  //       },
  //     },
  //   };

  //   pdfMake.createPdf(docDefinition).download('test.pdf');
  // }

}


