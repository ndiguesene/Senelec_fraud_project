import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexationComponent } from './indexation.component';

describe('IndexationComponent', () => {
  let component: IndexationComponent;
  let fixture: ComponentFixture<IndexationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndexationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
