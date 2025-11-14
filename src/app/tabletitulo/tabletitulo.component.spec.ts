import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabletituloComponent } from './tabletitulo.component';

describe('TabletituloComponent', () => {
  let component: TabletituloComponent;
  let fixture: ComponentFixture<TabletituloComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabletituloComponent]
    });
    fixture = TestBed.createComponent(TabletituloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
