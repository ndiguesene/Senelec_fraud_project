import { ElasticsearchService } from './service/elasticsearch.service';
import { HttpClientModule } from '@angular/common/http';
import { AmChartsModule } from '@amcharts/amcharts3-angular';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { IndexationComponent } from './indexation/indexation.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { RouterModule, Routes } from '@angular/router';
import { DashboardGlobalComponent } from './dashboard-global/dashboard-global.component';

// Angular Animations Module
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const appRoutes: Routes = [
  { path: '', component: DashboardGlobalComponent, pathMatch: 'full'},
  { path: 'indexation', component: IndexationComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboardGlobal', component: DashboardGlobalComponent },
  { path: '**', component: NotfoundComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    IndexationComponent,
    DashboardComponent,
    NotfoundComponent,
    DashboardGlobalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MDBBootstrapModule.forRoot(),
    RouterModule.forRoot(appRoutes),
    AmChartsModule,
    HttpClientModule
  ],
  schemas: [ NO_ERRORS_SCHEMA ],
  providers: [ElasticsearchService],
  bootstrap: [AppComponent]
})
export class AppModule { }
