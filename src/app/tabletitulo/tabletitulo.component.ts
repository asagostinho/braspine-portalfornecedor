import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PoTableColumn } from '@po-ui/ng-components';
import { TitulosService } from '../services/titulos.service';

@Component({
  selector: 'app-tabletitulo',
  templateUrl: './tabletitulo.component.html',
  styleUrls: ['./tabletitulo.component.css']
})
export class TabletituloComponent implements OnChanges{

  @Input() dados: Array<any> =[ ];

  public winHeight: any;
  public winWidth: any;
  itens: Array<any> = [];
  columns: Array<PoTableColumn> = [];

  constructor(private service: TitulosService) {}


  ngOnChanges(changes: SimpleChanges) {
    if ('dados' in changes) {
      this.itens = this.dados;

    }
  }

  ngOnInit(): void {
    this.getColumns();
    this.winHeight = window.innerHeight - (window.innerHeight * 0.30

    );
    this.winWidth = window.innerWidth ;

  }

  getColumns(): void {
    this.columns = this.service.getColumns();
  }

}
