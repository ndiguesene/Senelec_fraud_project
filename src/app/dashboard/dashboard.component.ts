import { ElasticsearchService } from './../service/elasticsearch.service';
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {AmChart, AmChartsService} from '@amcharts/amcharts3-angular';
import * as bodybuilder from 'bodybuilder';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnDestroy, OnInit{
    private chart: AmChart;
    private chartMap: AmChart;
    private data: any;
    /**
     * Liste des aggrégations
     */
    listeAggregation = [
        {
            key: 'Moyenne',
            value: 'avg'
        },
        {
            key: 'Somme',
            value: 'sum'
        },
        {
            key: 'Minimum',
            value: 'min'
        },
        {
            key: 'Maximum',
            value: 'max'
        },
    ];
    chartData = [];
    chartDataMap = [];
    listeFieldNumber = [];
    listeFieldDate = [];
    listeFieldText = [];
    listeChart = ['column', 'line', 'step'];
    typeChartSelected = 'null';
    fieldNameTypeDate = 'null';

    fieldNameX = 'null';
    fieldNameY = 'null';
    fieldNameMap = 'null';

    depth3D = 90;
    rotateLegende = 30;
    angle = 0;

    codeCountry = 'null';
    typeDeClient = 'null';
    columntypeDeClient = '';
    typeAggregation = 'null';

    topHitValue = 10;

    listeTypeClient = [];

    topHitValueDepartment = 10;
    topHitValueClient = 10;
    listeTopHitValueDepartment = [];
    listeTopHitValueClient = [];

    listeDepartment = [];
    nomChampForFiltreTopClient = 'Department';
    nomDepartmentSelected = 'null';

    listTopByFive = [];

    constructor(private AmCharts: AmChartsService, private es: ElasticsearchService) {}

    ngOnDestroy() {
        if (this.chart) {
            this.AmCharts.destroyChart(this.chart);
        }
    }
    selectFieldNameXValue(e) {
        this.fieldNameX = e.target.value;
        this.chartData = [];
        if (this.typeChartSelected === '' || this.typeAggregation === 'null') {

        } else {
            this.generateGraph(this.typeAggregation, this.fieldNameX, this.fieldNameY);
        }
    }
    selectFieldNameYValue(e) {
        this.fieldNameY = e.target.value;
        this.chartData = [];
        if (this.typeChartSelected === '' || this.typeAggregation === 'null') {

        } else {
            this.generateGraph(this.typeAggregation, this.fieldNameX, this.fieldNameY);
        }
    }
    selectTypeDeClient(e) {
        this.typeDeClient = e.target.value;
        this.chartData = [];
        if (this.typeChartSelected === 'null' || this.typeAggregation === 'null') {

        } else {
            this.generateGraph(this.typeAggregation, this.fieldNameX, this.fieldNameY);
        }
    }
    selectForTopHitDepartment(e) {
        this.topHitValueDepartment = e.target.value;
        this.listeTopHitValueDepartment = [];
        this.generateTableDepartment(this.topHitValueDepartment, 'Department', 'Risk', 'avg');
    }
    selectForTopHitClient(e) {
        this.topHitValueClient = e.target.value;
        this.listeTopHitValueClient = [];
        this.generateTableClient(this.topHitValueClient, 'Department', 'Risk', 'desc');
    }
    generateTableDepartment(numberOfHits, columnText, columnValue, typeAggregation) {
        const q = bodybuilder()
            .aggregation('terms', columnText + '.keyword', {
                size: 1000
                }, agg => agg.aggregation(typeAggregation, columnValue)).build();

        this.es.getDataWithRequeteAggregation('donneesgeo', q).subscribe(
            el => {
                this.es.getResultFilterAggregationBucket(el).forEach(
                    elee => {
                        // tslint:disable-next-line:max-line-length
                        this.listeTopHitValueDepartment.push({'key': elee.key, 'value': elee[Object.keys(elee)[0]].value * 100});
                    }
                );
                this.listeTopHitValueDepartment.sort(function(a, b) {
                    return b.value - a.value;
                });
                this.listeTopHitValueDepartment = this.listeTopHitValueDepartment.map(
                    e => ({'key': e.key, 'value': Math.trunc(e.value)})
                );
                /* permet de recupérer les n permiers valeurs */
                this.listeTopHitValueDepartment = this.listeTopHitValueDepartment.splice(
                    0, this.topHitValueDepartment
                );
            }
        );
    }
    selectFieldNameMap(e) {
        this.fieldNameMap = e.target.value;
        this.chartDataMap = [];
        if (this.fieldNameMap === 'null') {

        } else {
            this.generateGraphMap(this.codeCountry, this.fieldNameMap);
        }
    }
    selectTypeAggregation(e) {
        this.typeAggregation = e.target.value;
        this.chartData = [];
        if (this.typeChartSelected === 'null' || this.typeAggregation === 'null') {

        } else {
            this.generateGraph(this.typeAggregation, this.fieldNameX, this.fieldNameY);
        }
    }
    selectTypeChart(e) {
        this.typeChartSelected = e.target.value;
        this.chartData = [];
        if (this.typeChartSelected === 'null' || this.typeAggregation === 'null') {

        } else {
            this.generateGraph(this.typeAggregation, this.fieldNameX, this.fieldNameY);
        }
    }
    selectCodeCountry(e) {
        this.codeCountry = e.target.value;
        if (this.codeCountry === 'null' || this.fieldNameMap === 'null') {

        } else {
            this.generateGraphMap(this.codeCountry, this.fieldNameMap);
        }
    }
    selectColumnTypeDeClient(e) {
        this.columntypeDeClient = e.target.value;
        /**
         * Permet de recupérer la liste des types de clients se trouvant dans la base
         */
        const q = bodybuilder()
            .aggregation('terms', this.columntypeDeClient + '.keyword').build();

        this.es.getDataWithRequeteAggregation('donneesgeo', q).subscribe(
            el => {
                this.listeTypeClient = this.es.getResultFilterAggregationBucket(el);
            }
        );
        /**
         * Fin portion recupération de la liste des données
         */
    }
    selectForTopHitDepartmentForClient(e) {
        this.nomDepartmentSelected = (e.target.value === null) ? 'null' : e.target.value;
        this.listeTopHitValueClient = [];
        this.generateTableClient(this.topHitValueClient, 'Department', 'Risk', 'desc');
    }
    generateTableClient(numberOfHits, columnText, columnValue, sort) {
        if (this.nomDepartmentSelected === 'null') {
            const qu = bodybuilder()
                .sort(columnValue, sort)
                .size(numberOfHits)
                .build();

            this.es.getDataWithRequeteAggregation('donneesgeo', qu).subscribe(ele => {
                ele['hits']['hits'].forEach((element) => {
                    this.listeTopHitValueClient.push(element['_source']);
                });
            });
        } else {
            const q = bodybuilder().query('match_phrase', columnText, this.nomDepartmentSelected)
                .size(numberOfHits)
                .sort(columnValue, sort)
                .build();

            this.es.getDataWithRequeteAggregation('donneesgeo', q).subscribe(ele => {
                ele['hits']['hits'].forEach((element) => {
                    this.listeTopHitValueClient.push(element['_source']);
                });
            });
        }
    }
    ngOnInit() {
        const numPropsNumber = [];
        const numPropsDate = [];
        const numPropsText = [];
        this.es.getIndexFields('donneesgeo', 'doc').subscribe(response => {
            const mappings = response['donneesgeo'].mappings;
            const props = mappings[Object.keys(mappings)[0]].properties;
            for (const propName in props) {
                if (['integer', 'long', 'short', 'byte', 'double', 'float', 'half_float', 'scaled_float']
                    .indexOf(props[propName].type) >= 0) {
                    numPropsNumber.push(propName);
                } else if (['date', 'Date', 'date_time'].indexOf(props[propName].type) >= 0) {
                    numPropsDate.push(propName);
                } else if (['text', 'string'].indexOf(props[propName].type) >= 0) {
                    numPropsText.push(propName);
                }
            }
            this.listeFieldNumber = numPropsNumber;
            this.listeFieldDate = numPropsDate;
            this.listeFieldText = numPropsText;

            // Permet de recupérer la liste des département dans notre base de données
            this.es.getAllData('donneesgeo').subscribe(ele => {
                ele['hits']['hits'].forEach((element) => {
                    this.listeDepartment.push(element['_source'][this.nomChampForFiltreTopClient]);
                });
            });
        });


        this.genereGraphPie('chartdivPie1');
        this.genereGraphPie('chartdivPie2');
        this.genereGraphPie('chartdivPie3');
        this.genereGraphPie('chartdivPie4');
        this.generateGraphLine('donneesgeo', 'KWH', 'Consommation Energie', 'Date');
    }
    generateGraphLine(index, consommationColumn, titreAxeOrdonnée, typeDate) {
        let chartData = [];
        this.es.getAllData(index, 50).subscribe(
            ele => {
                ele['hits']['hits'].forEach((element, i) => {
                    let j = 0;
                    chartData.push({
                        'date': element['_source'][typeDate],
                        'consommation': element['_source'][consommationColumn]
                    });
                    j = (i === 12) ? 0 : j + 1;
                });
                this.AmCharts.makeChart('chartdivLine', {
                    'type': 'serial',
                    'theme': 'light',
                    'marginRight': 80,
                    'dataProvider': chartData,
                    'valueAxes': [{
                        'position': 'left',
                        'title': titreAxeOrdonnée
                    }],
                    'graphs': [{
                        'id': 'g1',
                        'fillAlphas': 0.4,
                        'valueField': 'consommation',
                        // tslint:disable-next-line:max-line-length
                        'balloonText': '<div style="margin:5px; font-size:19px;">' + titreAxeOrdonnée + ' - ' + consommationColumn + ':<b>[[value]]</b></div>'
                    }],
                    'chartScrollbar': {
                        'graph': 'g1',
                        'scrollbarHeight': 80,
                        'backgroundAlpha': 0,
                        'selectedBackgroundAlpha': 0.1,
                        'selectedBackgroundColor': '#888888',
                        'graphFillAlpha': 0,
                        'graphLineAlpha': 0.5,
                        'selectedGraphFillAlpha': 0,
                        'selectedGraphLineAlpha': 1,
                        'autoGridCount': true,
                        'color': '#AAAAAA'
                    },
                    'chartCursor': {
                        'categoryBalloonDateFormat': 'JJ:NN, DD MMMM',
                        'cursorPosition': 'mouse'
                    },
                    'categoryField': 'date',
                    'categoryAxis': {
                        'minPeriod': 'mm',
                        'parseDates': true
                    },
                    'export': {
                        'enabled': true,
                        'dateFormat': 'YYYY-MM-DD HH:NN:SS'
                    }
                });
            }
        );
    }
    genereGraphPie(id) {
        let chartData = {
            '1995': [
              { 'sector': 'Agriculture', 'size': 6.6 },
              { 'sector': 'Mining and Quarrying', 'size': 0.6 },
              { 'sector': 'Manufacturing', 'size': 23.2 },
              { 'sector': 'Electricity and Water', 'size': 2.2 },
              { 'sector': 'Construction', 'size': 4.5 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 14.6 },
              { 'sector': 'Transport and Communication', 'size': 9.3 },
              { 'sector': 'Finance, real estate and business services', 'size': 22.5 } ],
            '1996': [
              { 'sector': 'Agriculture', 'size': 6.4 },
              { 'sector': 'Mining and Quarrying', 'size': 0.5 },
              { 'sector': 'Manufacturing', 'size': 22.4 },
              { 'sector': 'Electricity and Water', 'size': 2 },
              { 'sector': 'Construction', 'size': 4.2 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 14.8 },
              { 'sector': 'Transport and Communication', 'size': 9.7 },
              { 'sector': 'Finance, real estate and business services', 'size': 22 } ],
            '1997': [
              { 'sector': 'Agriculture', 'size': 6.1 },
              { 'sector': 'Mining and Quarrying', 'size': 0.2 },
              { 'sector': 'Manufacturing', 'size': 20.9 },
              { 'sector': 'Electricity and Water', 'size': 1.8 },
              { 'sector': 'Construction', 'size': 4.2 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 13.7 },
              { 'sector': 'Transport and Communication', 'size': 9.4 },
              { 'sector': 'Finance, real estate and business services', 'size': 22.1 } ],
            '1998': [
              { 'sector': 'Agriculture', 'size': 6.2 },
              { 'sector': 'Mining and Quarrying', 'size': 0.3 },
              { 'sector': 'Manufacturing', 'size': 21.4 },
              { 'sector': 'Electricity and Water', 'size': 1.9 },
              { 'sector': 'Construction', 'size': 4.2 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 14.5 },
              { 'sector': 'Transport and Communication', 'size': 10.6 },
              { 'sector': 'Finance, real estate and business services', 'size': 23 } ],
            '1999': [
              { 'sector': 'Agriculture', 'size': 5.7 },
              { 'sector': 'Mining and Quarrying', 'size': 0.2 },
              { 'sector': 'Manufacturing', 'size': 20 },
              { 'sector': 'Electricity and Water', 'size': 1.8 },
              { 'sector': 'Construction', 'size': 4.4 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 15.2 },
              { 'sector': 'Transport and Communication', 'size': 10.5 },
              { 'sector': 'Finance, real estate and business services', 'size': 24.7 } ],
            '2000': [
              { 'sector': 'Agriculture', 'size': 5.1 },
              { 'sector': 'Mining and Quarrying', 'size': 0.3 },
              { 'sector': 'Manufacturing', 'size': 20.4 },
              { 'sector': 'Electricity and Water', 'size': 1.7 },
              { 'sector': 'Construction', 'size': 4 },
              { 'sector': 'Trade (Wholesale, Retail, Motor)', 'size': 16.3 },
              { 'sector': 'Transport and Communication', 'size': 10.7 },
              { 'sector': 'Finance, real estate and business services', 'size': 24.6 } ]
          };
          /**
           * Create the chart
           */
          let currentYear = 1995;
          let chart = this.AmCharts.makeChart(id, {
            'type': 'pie',
            'theme': 'light',
            'dataProvider': [],
            'valueField': 'size',
            'titleField': 'sector',
            'startDuration': 0,
            'innerRadius': 80,
            'pullOutRadius': 20,
            'marginTop': 30,
            'titles': [{
              'text': 'South African Economy'
            }],
            'allLabels': [{
              'y': '54%',
              'align': 'center',
              'size': 25,
              'bold': true,
              'text': '1995',
              'color': '#555'
            }, {
              'y': '49%',
              'align': 'center',
              'size': 15,
              'text': 'Year',
              'color': '#555'
            }],
            'listeners': [ {
              'event': 'init',
              'method': function( e ) {
                let chart = e.chart;
                function getCurrentData() {
                  let data = chartData[currentYear];
                  currentYear++;
                  if (currentYear > 2014) {
                    currentYear = 1995;
                  }
                  return data;
                }
                function loop() {
                  chart.allLabels[0].text = currentYear;
                  let data = getCurrentData();
                  chart.animateData( data, {
                    duration: 1000,
                    complete: function() {
                      setTimeout( loop, 3000 );
                    }
                  } );
                }
                loop();
              }
            } ],
             'export': {
             'enabled': true
            }
          } );
    }
    generateGraphMap(codeCountry, fieldNameMap) {
        if (codeCountry) {
            this.es.getAllData('donneesgeo', 50).subscribe(
                el => {
                    this.data = el;
                    this.data['hits']['hits'].forEach(element => {
                        this.chartDataMap.push({
                            'id': element['_source'][codeCountry],
                            'value': element['_source'][fieldNameMap]
                        });
                    });
                    this.chartMap = this.AmCharts.makeChart('chartdiv1', {
                        'type': 'map',
                        'theme': 'light',
                        'colorSteps': 10,
                        'dataProvider': {
                            'map': 'senegalLow',
                            'getAreasFromMap': true,
                            'areas': this.chartDataMap
                        },
                        'areasSettings': {
                        'autoZoom': true
                        },
                        'valueLegend': {
                            'right': 10,
                            'minValue': '0',
                            'maxValue': 'N'
                        },
                        'export': {
                            'enabled': true
                        }
                    });
                }
            );
        }
    }
    randomColor(opacity: number): string {
        // tslint:disable-next-line:max-line-length
        return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')';
    }
    generateGraph(typeAggregation, fieldNameYValue, fieldNameXValue) {
        let querr;
        if (this.typeDeClient === 'null') {
            if (fieldNameXValue === 'null') {
                querr = bodybuilder()
                    .aggregation('terms', fieldNameYValue + '.keyword', {
                        size: 1000
                    }).build();
            } else {
                querr = bodybuilder()
                    .aggregation('terms', fieldNameYValue + '.keyword', {
                        size: 1000
                    }, agg => agg.aggregation(typeAggregation, fieldNameXValue)
                    ).build();
            }
            this.es.getDataWithRequeteAggregation('donneesgeo', querr).subscribe(
                ele => {
                    this.es.getResultFilterAggregationBucket(ele).forEach((element) => {
                        const nameAggregation = Object.keys(element)[0];
                        this.chartData.push({
                            'key': element['key'],
                            'value': element[nameAggregation].value,
                            'color': this.randomColor(1)
                        });
                    });
                    this.chartData.sort(function(a, b) {
                        return b.value - a.value;
                    });
                    this.chart = this.AmCharts.makeChart('chartdiv', {
                        'type': 'serial',
                        'startDuration': 1,
                        'valueAxes': [{
                            'position': 'left',
                            'axisAlpha': 0,
                            'gridAlpha': 0
                        }],
                        'graphs': [{
                            'balloonText': '[[key]] : <b>[[value]]</b>',
                            'colorField': 'color',
                            'fillAlphas': 0.85,
                            'lineAlpha': 0.1,
                            'type': this.typeChartSelected, // column, line ou step 3types de graphes q'on peut avoir pour le bar
                            'topRadius': 1,
                            'valueField': 'value'
                        }],
                        'depth3D': this.depth3D,
                        'angle': this.angle,
                        'chartCursor': {
                            'categoryBalloonEnabled': false,
                            'cursorAlpha': 0,
                            'zoomable': false
                        },
                        'categoryField': 'key',
                        'categoryAxis': {
                            'gridPosition': 'start',
                            'axisAlpha': 0,
                            'gridAlpha': 0,
                            'labelRotation': this.rotateLegende
                        },
                        'export': {
                            'enabled': true
                         },
                        'dataProvider': this.chartData
                    });
                }
            );
        } else { // sil ne sélectionne pas un type de client
            querr = bodybuilder()
                .aggregation('terms', 'TypeDeClient.keyword',
                    ag => ag.aggregation('terms', fieldNameYValue + '.keyword', {
                            size: 1000
                        },
                            agg => agg.aggregation(typeAggregation, fieldNameXValue)
                        )
                    ).build();
            this.es.getDataWithRequeteAggregation('donneesgeo', querr).subscribe(
                ele => {
                    this.es.getResultFilterAggregationBucket(ele).forEach((element) => {
                        const nameAggregation = Object.keys(element)[0];
                        if (element['key'] === this.typeDeClient) {
                            (element[nameAggregation].buckets).forEach(elemen => {
                                this.chartData.push({
                                    'date': elemen['key'],
                                    'value': elemen[Object.keys(elemen)[0]].value,
                                    'color': this.randomColor(1)
                                });
                                this.chartData.sort(function(a, b) {
                                    return b.value - a.value;
                                });
                            });
                        }
                    });
                    this.chart = this.AmCharts.makeChart('chartdiv', {
                        'type': 'serial',
                        'startDuration': 1,
                        'valueAxes': [{
                            'position': 'left',
                            'axisAlpha': 0,
                            'gridAlpha': 0
                        }],
                        'graphs': [{
                            'balloonText': '[[date]] : <b>[[value]]</b>',
                            'colorField': 'color',
                            'fillAlphas': 0.85,
                            'lineAlpha': 0.1,
                            'type': this.typeChartSelected, // column, line ou step 3types de graphes q'on peut avoir pour le bar
                            'topRadius': 1,
                            'valueField': 'value'
                        }],
                        'depth3D': this.depth3D,
                        'angle': this.angle,
                        'chartCursor': {
                            'categoryBalloonEnabled': false,
                            'cursorAlpha': 0,
                            'zoomable': false
                        },
                        'categoryField': 'date',
                        'categoryAxis': {
                            'gridPosition': 'start',
                            'axisAlpha': 0,
                            'gridAlpha': 0,
                            'labelRotation': this.rotateLegende
                        },
                        'export': {
                            'enabled': true
                        },
                        'dataProvider': this.chartData
                    });
                }
            );
        }
    }
}
