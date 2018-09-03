import { Config } from './../Config/Config';
import {Injectable, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
// import * as bodybuilder from 'bodybuilder';

@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {

    constructor(private http: HttpClient) {}

    getDataWithRequeteAggregation(index, query) {
        return this.http.post(Config.HTTP_URL + '' + Config.BASE_URL + ':' + Config.PORT + '/search/' + index, query);
    }
    getAllData(index, size = 20) {
      const queryalldocs = {
          'query': {
            'match_all': {},
          },
          'size': size
        };
      return this.http.post(Config.HTTP_URL + '' + Config.BASE_URL + ':' + Config.PORT + '/search/' + index, queryalldocs);
  }
    public getIndexFields(index, type) {
      return this.map(index, type);
    }
    private map(index, type) {
      return this.http.get(Config.HTTP_URL + '' + Config.BASE_URL + ':' + Config.PORT + '/getMapping/' + index + '/' + type);
    }
    getResultFilterAggregationBucket(response: any): any {
      const nameAggregation = Object.keys(response.aggregations)[0];
      const aggResponse =
        (response.aggregations) ? response.aggregations[nameAggregation] : response[nameAggregation] || null;
      if (aggResponse['buckets']) {
        return aggResponse['buckets'];
      } else if (aggResponse['aggregations']) {
        return aggResponse['aggregations'];
      } else {
        return aggResponse;
      }
    }

}
