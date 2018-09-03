import { Component, OnInit } from '@angular/core';

import { ElasticsearchService } from './../service/elasticsearch.service';
import { AmChartsService} from '@amcharts/amcharts3-angular';

import * as bodybuilder from 'bodybuilder';

declare var $: any;

@Component({
  selector: 'app-dashboard-global',
  templateUrl: './dashboard-global.component.html',
  styleUrls: ['./dashboard-global.component.scss']
})
export class DashboardGlobalComponent implements OnInit {

  constructor(private es: ElasticsearchService, private AmCharts: AmChartsService) { }
  colorSelect = [];
  listeDepartment = [];
  listeRegion = [];
  chartDataMap = [];
  listeTopHitValueDepartment = [];
  listeTopHitValueClient  = [];

  ngOnInit() {
    this.es.getAllData('donneesgeo').subscribe(ele => {
        ele['hits']['hits'].forEach((element) => {
            this.listeDepartment.push(element['_source']['Department']);
            this.listeRegion.push(element['_source']['DOMAIN']);
        });
    });

    this.generateGraph('avg', 'Department', 'Risk', 'Répartition des départements suivant leur propension à la fraude');
    this.generateGraphLine('donneesgeo', 'KWH', 'Consommation Energie', 'Date', 'Consommation dénergie');
    this.generateGraphMap('CodeCountry', 'Risk', 'Répartition spatiale du chiffre daffaire');
    this.genereGraphPie('chartdivPie1', 'Suspectés de fraude');
    this.genereGraphPie('chartdivPie2', 'Suspectés de fraude');
    this.genereGraphPie('chartdivPie3', 'Suspectés de fraude');
    this.genereGraphPie('chartdivPie4', 'Suspectés de fraude');
    this.generateTableDepartment(10, 'Department', 'Risk', 'avg');
    this.generateTableClient(10, 'Department', 'Risk', 'desc');
  }
  generateTableClient(numberOfHits, columnText, columnValue, sort) {
    // if (this.nomDepartmentSelected === 'null') {
        const qu = bodybuilder()
            .sort(columnValue, sort)
            .size(numberOfHits)
            .build();

        this.es.getDataWithRequeteAggregation('donneesgeo', qu).subscribe(ele => {
            ele['hits']['hits'].forEach((element) => {
                this.listeTopHitValueClient.push(element['_source']);
            });
        });
    /* } else {
        const q = bodybuilder().query('match_phrase', columnText, this.nomDepartmentSelected)
            .size(numberOfHits)
            .sort(columnValue, sort)
            .build();

        this.es.getDataWithRequeteAggregation('donneesgeo', q).subscribe(ele => {
            ele['hits']['hits'].forEach((element) => {
                this.listeTopHitValueClient.push(element['_source']);
            });
        });
    } */
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
                0, numberOfHits
            );
        }
    );
}
  generateGraphLine(index, consommationColumn, titreAxeOrdonnée, typeDate, title) {
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
                'titles': [ {
                    'text': title,
                }],
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
                    'enabled': false,
                    'dateFormat': 'YYYY-MM-DD HH:NN:SS'
                }
            });
        }
    );
  }
  generateGraphMap(codeCountry, fieldNameMap, title) {
    if (codeCountry) {
        this.es.getAllData('donneesgeo', 50).subscribe(
            el => {
                let data = el;
                data['hits']['hits'].forEach(element => {
                    this.chartDataMap.push({
                        'id': element['_source'][codeCountry],
                        'value': element['_source'][fieldNameMap]
                    });
                });
                this.AmCharts.makeChart('chartdivMap', {
                    'type': 'map',
                    'theme': 'light',
                    'titles': [ {
                        'text': title,
                    }],
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
                        'enabled': false
                    }
                });
            }
        );
    }
}
    genereGraphPie(id, title) {
        const querr = bodybuilder()
                        .aggregation('terms', 'TypeDeClient.keyword').build();
        this.es.getDataWithRequeteAggregation('donneesgeo', querr).subscribe(
            er => {
                let tab = this.es.getResultFilterAggregationBucket(er);
                let chart = this.AmCharts.makeChart(id, {
                    'type': 'pie',
                    'theme': 'light',
                    'titles': [ {
                        'text': title,
                    }],
                    'dataProvider': tab,
                    'valueField': 'doc_count',
                    'titleField': 'key',
                    'pullOutRadius': 0,
                    'labelRadius': -22,
                    'labelText': '[[key]]: [[doc_count]] %',
                    'percentPrecision': 1,
                     'balloon': {
                     'fixedPosition': true
                    },
                    'export': {
                      'enabled': false
                    }
                });
            }
        );
    }
    randomColor(opacity: number): string {
        // tslint:disable-next-line:max-line-length
        return 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (opacity || '.3') + ')';
    }
    generateGraph(typeAggregation, fieldNameYValue, fieldNameXValue, title) {
        const querr = bodybuilder()
                    .aggregation('terms', fieldNameYValue + '.keyword', {
                        size: 1000
                    }, agg => agg.aggregation(typeAggregation, fieldNameXValue)
                    ).build();

            let chartData = [];
            this.es.getDataWithRequeteAggregation('donneesgeo', querr).subscribe(
                ele => {
                    this.es.getResultFilterAggregationBucket(ele).forEach((element) => {
                        const nameAggregation = Object.keys(element)[0];
                        chartData.push({
                            'key': element['key'],
                            'value': element[nameAggregation].value,
                            'color': this.randomColor(1)
                        });
                    });
                    chartData.sort(function(a, b) {
                        return b.value - a.value;
                    });
                    this.AmCharts.makeChart('chartdivBar', {
                        'type': 'serial',
                        'startDuration': 1,
                        'titles': [ {
                            'text': title,
                        }],
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
                            'type': 'column', // column, line ou step 3types de graphes q'on peut avoir pour le bar
                            'topRadius': 1,
                            'valueField': 'value'
                        }],
                        'depth3D': 0,
                        'angle': 0,
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
                            'labelRotation': 0
                        },
                        'export': {
                            'enabled': false
                         },
                        'dataProvider': chartData
                    });
                }
            );
        }
    }
