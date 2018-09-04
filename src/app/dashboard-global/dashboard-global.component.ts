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
  stat = 'ndigue sene';
  infos = [];

  ngOnInit() {
    this.es.getAllData('donneesgeo').subscribe(ele => {
        ele['hits']['hits'].forEach((element) => {
            this.listeDepartment.push(element['_source']['Department']);
            this.listeRegion.push(element['_source']['DOMAIN']);
        });
    });

    this.generateGraph('avg', 'Department', 'Risk', 'Répartition des départements suivant leur propension à la fraude');
    this.generateGraphLine('donneesgeo', 'KWH', 'Consommation Energie', 'Date', 'Consommation dénergie');
    this.generateGraphMap('CodeCountry', 'Risk', 'Répartition spatiale du chiffre daffaire', 'DOMAIN');
    this.genereGraphPie('chartdivPie1', 'Suspectés de fraude');
    this.genereGraphPieRegionAndDepartment('chartdivPie2', '% des Top 3 régions susppectés de fraude', 'DOMAIN', 'Class');
    this.genereGraphPieRegionAndDepartment('chartdivPie3', 'Suspectés de fraude', 'Department', 'Class');
    this.generateTableDepartment(3, 'Department', 'Risk', 'avg');
    this.generateTableClient(3, 'Department', 'Risk', 'desc');
  }
  genereGraphPieRegionAndDepartment(id, title, columnX, columnY) {
    const querr = bodybuilder()
        .aggregation('terms', columnX + '.keyword', {
        size: 1000
        }, agg => agg.aggregation('terms', columnY)).build();
        this.es.getDataWithRequeteAggregation('donneesgeo', querr).subscribe(
            er => {
                let chartData = [];
                this.es.getResultFilterAggregationBucket(er).forEach((element) => {
                    const nameAggregation = Object.keys(element)[0];

                    chartData.push({
                        'key': element['key'],
                        'value': element[nameAggregation].buckets['1'].doc_count,
                        'color': this.randomColor(1)
                    });
                });
                chartData.sort(function(a, b) {
                    return b.value - a.value;
                });
                chartData = chartData.splice(
                    0, 3
                );
                let chart = this.AmCharts.makeChart(id, {
                    'type': 'pie',
                    'theme': 'light',
                    'legend': {
                        'position': 'top',
                        'marginRight': 100,
                        'autoMargins': false
                    },
                    'titles': [ {
                        'text': title,
                    }],
                    'dataProvider': chartData,
                    'titleField': 'key',
                    'valueField': 'value',
                    'labelRadius': 5,
                    'radius': '42%',
                    'innerRadius': '60%',
                    'labelText': '[[]]'
                });
            }
        );
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
  /* getInfos(codeCountry, champInfos, fieldNameMap): any {
    const q = bodybuilder()
        .aggregation('terms', 'DOMAIN.keyword',
        agg => agg.aggregation('stats', 'Sales')).build();
        this.es.getDataWithRequeteAggregation('donneesgeo', q).subscribe(
            stat => {
                this.es.getResultFilterAggregationBucket(stat).every(async vall => {
                    const nameAggregation = await Object.keys(vall)[0];
                    if (codeCountry === vall['key']) {
                        alert(vall['key']);
                        // console.log(vall[nameAggregation]);
                        this.infos.push({
                            'infos': vall[nameAggregation]
                        });
                        return false;
                    }
                });
            }
        );
  } */
    getInfos(value) {
        // let inf = [];
        const r = bodybuilder()
            .query('match_phrase', 'DOMAIN', value)
            .aggregation('stats', 'Sales').build();
        return this.es.getDataWithRequeteAggregation('donneesgeo', r);
    }
  async generateGraphMap(codeCountry, fieldNameMap, title, champInfos) {
    if (codeCountry) {
        await this.es.getAllData('donneesgeo', 50).subscribe(
            el => {
                let data = el;
                let liste = ['Dakar', 'Louga', 'Kolda', 'Matam'];
                data['hits']['hits'].forEach((element, i) => {
                    this.getInfos('Dakar').subscribe(vall => {
                        this.chartDataMap.push({
                            'id': element['_source'][codeCountry],
                            'value': element['_source'][fieldNameMap],
                            'infos': JSON.stringify(this.es.getResultFilterAggregationBucket(vall))
                        });
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
                        'autoZoom': false,
                        'selectable': true
                    },
                    'valueLegend': {
                        'right': 10,
                        'minValue': '0',
                        'maxValue': 'N'
                    },
                    'export': {
                        'enabled': false
                    },
                    'listeners': [{
                        'event': 'clickMapObject',
                        'method': function(event) {
                            document.getElementById('infos').innerHTML = event.mapObject.title + ' - ' + event.mapObject.infos;
                        }
                    }]
                });
            });
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
                    'legend': {
                        'position': 'top',
                        'marginRight': 100,
                        'autoMargins': false
                    },
                    'dataProvider': tab,
                    'titleField': 'key',
                    'valueField': 'doc_count',
                    'labelRadius': 5,
                    'radius': '42%',
                    'innerRadius': '60%',
                    'labelText': '[[]]',
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
