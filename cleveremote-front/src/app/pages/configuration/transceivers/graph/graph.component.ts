import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterContentInit, Input } from '@angular/core';
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import * as d3Lib from 'd3';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { NbIconLibraries } from '@nebular/theme';
import * as difference from 'lodash.difference';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CoreDataService } from '../../../../services/core.data.service';
import { RessourcesService } from '../../../../services/ressources.service';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

export enum STATUS {
  NONE = 'NONE',
  LOAD = 'LOAD',
  LOAD_SAVED = 'LOAD_SAVED'
}

@Component({
  selector: 'graph-network',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})



export class GraphComponent implements AfterContentInit, OnDestroy {
  title = 'app';
  radius = 10;
  public d3 = d3Lib;
  public svg;
  public legend;
  public simulation$;
  public width;
  public height;
  public currentScale: number = 1;
  public zoom;
  public dataset;
  public filter: Array<any>;
  public isMobile;
  private subscriptions: Array<Subscription> = [];
  @Input() revealed: any;

  @ViewChild('pContainer', { static: true }) pcontainer: ElementRef;
  // is the declaration. To get the value, it's this.pcontainer.nativeElement.offsetWidth. For your ide, you can use (this.container.nativeElement as HTMLElement).offsetWidth. 

  public status: STATUS;
  constructor(iconsLibrary: NbIconLibraries,
    private deviceService: DeviceDetectorService,
    private coreDataService: CoreDataService,
    private resourceService: RessourcesService
  ) {
    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
    iconsLibrary.registerFontPack('fas', { packClass: 'fas', iconClassPrefix: 'fa' });
    this.isMobile = this.deviceService.isMobile();
    const t = '';

    const g = t || undefined;
    const y = 0;
    const $zoomed = () => {
      if (isNaN(this.d3.event.transform.x) || isNaN(this.d3.event.transform.y)) {
        this.d3.event.transform.x = 0;
        this.d3.event.transform.y = 0;
      }
      this.svg.attr('transform', this.d3.event.transform);
      this.currentScale = this.d3.event.transform.k;
      const g: any = d3Lib.select('#dragCt');
      const parent = this.svg.node().parentNode.getBoundingClientRect();
      const container = g.node().getBoundingClientRect();
      d3Lib.select(g.node()).attr('transform', (d: any) => {
        return 'translate(' + [d.x - (container.x - parent.x), d.y - (container.y - parent.y)] + ')' + this.d3.event.transform;
      });

      this.calculatePointText(g.selectAll('.nodes')._groups[0]);
    };
    this.zoom = this.d3.zoom().on('zoom', $zoomed);
  }

  ngOnDestroy(): void {
    this.simulation$.stop();
    this.unsubscribeAll();
  }

  public unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
  }

  public listenStatuschange() {
    const subscription = this.coreDataService.networkCollection.onNetworkChanges.subscribe((network: any) => {
      console.log('updated graph data', network);
      delete network.id;
      this.updateGraph(network);
    });
    this.subscriptions.push(subscription);
  }

  ngAfterContentInit() {

    this.initSvg();

    setTimeout(() => {
      this.loadLayout();
      this.listenStatuschange();
    }, 1000);

  }

  public zoomIn() {
    this.zoomFunction(0);
  }

  public zoomOut() {
    this.zoomFunction(1);
  }

  public zoomFunction(zoomIn: number, current: boolean = false) {
    this.simulation$.stop();
    this.currentScale = current ? this.currentScale : (zoomIn === 0 ? this.currentScale + 0.1 : this.currentScale - 0.1);
    this.zoom.scaleTo(this.svg, this.currentScale);
  }

  public fitGraph() {
    this.simulation$.stop();
    this.findScale();
  }

  public buildGraphData(data): any {
    //update module status by parent status .

    const graphData = { nodes: [], links: [] };
    data.nodes.forEach(node => {
      const transceiver = this.coreDataService.transceiverCollection.elements.find((transceiver) => transceiver.id === node.id);
      graphData.nodes.push({ id: transceiver.id, name: transceiver.name, label: transceiver.name, type: transceiver.type, runtime: 100, power: node.data.power, status: node.data.status });
      // { source: transceiver.address64, target: neighborlqi.extAddr, lqi: neighborlqi.lqi, type: 'AIR' };
      // transceiver.modules.forEach(module => {
      //   graphData.nodes.push({ id: module.id, name: module.name, label: module.name, group: 'MODULE', runtime: 40, data: module, status: node.data.status });
      //   graphData.links.push({ source: module.id, target: transceiver.id, status: node.data.status, type: 'WIRE' });
      //   graphData.links.push({ source: transceiver.id, target: module.id, status: node.data.status, type: 'WIRE' });
      // });
    });
    data.links.forEach(link => {
      const concernedNodes = graphData.nodes.filter((node) => node.id === link.source || node.id === link.traget);
      let status = 'ACTIF';
      for (let index = 0; index < concernedNodes.length; index++) {
        const node = concernedNodes[index];
        if (node.status !== 'ACTIF') {
          status = node.status;
          break;
        }
      }
      graphData.links.push({ source: link.source, target: link.target, type: `-->> ${status !== 'ACTIF' ? '?' : link.data.lqi}`, data: { strength: link.data.lqi } });
    });
    return graphData;
  }

  public organizeGraph() {

    this.resourceService.fullScan('server_1').subscribe((response) => { // this.coreDataService.currentDevice.id
      this.clearLayoutData(false);

      const newdata = JSON.parse(response[0].value).graphData;
      //this.updateLayoutData(newdata);

      if (this.status = STATUS.LOAD_SAVED) {
        this.status = STATUS.NONE;
        for (let index = 0; index < newdata.nodes.length; index++) {
          newdata.nodes[index].fx = newdata.nodes[index].x;
          newdata.nodes[index].fy = newdata.nodes[index].y;
          newdata.nodes[index].fixed = 1;
        }
      }

      this.dataset = newdata;
      this.updateGraphData(newdata);
    });
    //this.updateGraphData(this.dataset);
  }

  public updateGraph(data) {
    //this.status = STATUS.NONE;
    this.clearLayoutData(false);
    this.updateLayoutData(data);
    this.dataset = data;
    this.updateGraphData(data);
    this.updateLayoutData(data, false);
    //this.status = STATUS.LOAD;
  }

  public saveLayout() {
    localStorage.setItem('graphData', JSON.stringify(this.dataset));
  }

  public loadLayout() {
    const data = undefined;//localStorage.getItem('graphData');
    if (data) {
      this.status = STATUS.LOAD_SAVED;
      this.dataset = JSON.parse(data);
      this.buildGraphElemements(this.dataset);
    } else {
      this.status = STATUS.LOAD;
      this.resourceService.fullScan('server_1').subscribe((response) => { // this.coreDataService.currentDevice.id
        this.dataset = JSON.parse(response[0].value).graphData;
        this.buildGraphElemements(this.dataset);
      });
    }
  }

  public removeElements() {
    // this.clearLayoutData(false);
    // const newData = this.initData(1);
    // this.updateLayoutData(newData);
    // this.dataset = newData;
    // this.filter = [];
    // this.updateGraphData(this.dataset);
  }

  public addElements() {
    // this.clearLayoutData(false);
    // const newdata = this.initData(3);
    // this.filter = difference(newdata.nodes.map(x => x.id), this.dataset.nodes.map(x => x.id));
    // this.filter = this.filter && this.filter.length > 0 ? this.filter : undefined;
    // this.dataset = newdata;
    // this.updateGraphData(this.dataset);
  }

  public clearLayoutData(includeNodes: boolean) {
    if (this.dataset.links[0].source instanceof Object) {
      this.dataset.links.forEach((link, index) => {
        this.dataset.links[index] = { source: link.source.id, target: link.target.id, type: link.type, status: link.status, lqi: link.lqi, lqibis: link.lqibis };
      });
    }
    if (includeNodes) {
      this.dataset.nodes.forEach((node, index) => {
        this.dataset.nodes[index] = { id: node.id, name: node.name, type: node.type, status: node.status, powerSupply: node.powerSupply };
      });
    }
  }

  public updateLayoutData(newData: any, fix = true) {
    newData.nodes.forEach((node, index) => {
      const previous = this.dataset && this.dataset.nodes ? this.dataset.nodes.find((n) => n.id === node.id) : undefined;
      if (previous && fix) {
        node.x = previous.x;
        node.y = previous.y;
        node.vy = previous.vy;
        node.vx = previous.vx;
        node.fx = previous.x;
        node.fy = previous.y;
      } else {
        node.fx = null;
        node.fy = null;
      }
    });
  }

  public findScale() {
    const g: any = d3Lib.select('#dragCt');
    d3Lib.select(g.node()).attr('transform', (d: any) => {

      const trans = 'translate(' + [-d.x, -d.y] + ')';
      d.x = 0;
      d.y = 0;
      return trans;
    });

    this.zoom.scaleTo(this.svg, 1);
    const offsetG = this.pcontainer.nativeElement.offsetWidth;
    const currentWidth = this.vwTOpx(this.width);
    const currentHeight = this.vhTOpx(this.height);
    const svgWidth = g.node().getBoundingClientRect().width;
    const svgHeight = g.node().getBoundingClientRect().height;
    if (currentWidth > svgWidth) {
      const scaleWidthPercent = ((currentWidth * 100) / svgWidth);
      const scaleHeightPercent = ((currentHeight * 100) / svgHeight);
      const finalscale = Math.min(scaleWidthPercent, scaleHeightPercent) / 100;
      this.zoom.scaleTo(this.svg, finalscale);

    } else {
      const scaleWidthPercent = ((currentWidth * 100) / svgWidth);
      const scaleHeightPercent = ((currentHeight * 100) / svgHeight);
      const finalscale = Math.min(scaleWidthPercent, scaleHeightPercent) / 100;
      this.zoom.scaleTo(this.svg, finalscale);
    }

  }

  public updateGraphData(currentDataSet: any) {

    this.createLinks(currentDataSet.links, true);
    this.createEdgePaths(currentDataSet.links, true);
    this.createEdgeLabels(currentDataSet.links, true);
    this.createNodes(currentDataSet.nodes, true);

    this.simulation$.nodes(currentDataSet.nodes);
    this.simulation$.force('link').links(currentDataSet.links);
    this.simulation$.alphaTarget(0.1).restart();

  }

  public buildGraphElemements(dataset) {
    if (dataset.links[0].source instanceof Object) {
      dataset.links.forEach((link, index) => {
        dataset.links[index] = { source: link.source.id, target: link.target.id, type: link.type, status: link.status, lqi: link.lqi, lqibis: link.lqibis };
      });
    }
    const links = this.createLinks(dataset.links);
    const edgepaths = this.createEdgePaths(dataset.links);
    const edgelabels = this.createEdgeLabels(dataset.links);
    const nodes = this.createNodes(dataset.nodes);

    const _this = this;
    const g: any = d3Lib.select('#dragCt');
    g.cx = 0;
    const dragged = (d: any) => {
      d.y += d3Lib.event.dy;
      d.x += d3Lib.event.dx;
      d3Lib.select(g.node()).attr('transform', (d: any) => {
        return 'translate(' + [d.x, d.y] + ')';
      });
      this.zoom.scaleTo(this.svg, this.currentScale);
    };

    g.data([{ x: 0, y: 0 }])
      .call(d3Lib.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragend)
      );
    function dragstarted(d) {
      _this.simulation$.stop();
      d3Lib.event.sourceEvent.stopPropagation();
      g.selectAll('.nodes').classed('active', true);
    }

    function dragend(d) {
      g.selectAll('.nodes').classed('active', false);
    }

    this.startGraph(dataset);
  }


  public startGraph(dataset, filter?: Array<any>): void {

    const ticked$ = () => {

      const nodes = this.svg.selectAll('.nodes');
      const links = this.svg.selectAll('.links');
      const edgepaths = this.svg.selectAll('.edgepath');
      const edgeLabels = this.svg.selectAll('.edgelabel');

      links._groups[0].forEach((link) => {
        const firstChild = link.parentNode.firstChild;
        if (firstChild) {
          link.parentNode.insertBefore(link, firstChild);
        }
      });

      links.attr('x1', function (d: any) { return Math.min(d.target.x, d.source.x); })
        .attr('y1', function (d: any) { return Number(this.getAttribute('x1')) === d.target.x ? d.target.y : d.source.y; })
        .attr('x2', function (d: any) { return Math.max(d.target.x, d.source.x); })
        .attr('y2', function (d: any) { return Number(this.getAttribute('x2')) === d.target.x ? d.target.y : d.source.y; });

      nodes.attr('fx', (d: any) => d.x)
        .attr('fy', (d: any) => d.y);

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      // if (this.status === STATUS.LOAD) {
      this.findScale();
      // }

      this.calculatePointText(nodes._groups[0]);

      edgepaths.attr('d', function (d: any) {
        return d.target.x <= d.source.x ? `M  ${d.target.x} ${d.target.y} L ${d.source.x} ${d.source.y}` : `M  ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
      });

      edgeLabels.selectAll('textPath').text(function (d: any) {
        if (d.target.x <= d.source.x) {
          return d.lqi && d.lqibis ? d.lqi + '\uf060' + '\uf061' + d.lqibis + 'bis' : (d.lqi ? d.lqi + '\uf060' : '');
        }
        return d.lqi && d.lqibis ? d.lqibis + '\uf060' + '\uf061' + d.lqi + 'bis' : (d.lqi ? d.lqi + '\uf061' : '');
      });

      const offsetG = this.pcontainer.nativeElement.offsetWidth;
      this.width = this.pxTOvw(offsetG - (this.isMobile ? 86 : 160))
      this.d3.select('div#container').select('svg')
        .attr('width', `${this.width}vw`);
    };

    const simulation$: any = this.d3.forceSimulation()
      .force('link', this.d3.forceLink()
        .id((d: any) => d.id)
        .distance(50)
      )
      .force('charge', this.d3.forceManyBody().strength(-800))
      .force('center', this.d3.forceCenter(this.getWidth() / 2, this.getHeight() / 2))
      .alphaTarget(0.1)
      .on('tick', ticked$);

    const simulationResult = simulation$;
    simulationResult.nodes(dataset.nodes)
      .on('tick', ticked$);

    simulationResult.force('link')
      .links(dataset.links);

    this.simulation$ = simulationResult;
  }

  public createLinks(dataset, merge: boolean = false): any {
    let links = this.svg.selectAll('.links')
      .data(dataset, function (d) { return d.source.id + '-' + d.target.id; }); //+ '-' + d.status + '-' + d.lqi + '-' + d.lqibis
    links.exit().remove();
    const enter = links.enter().append('line')
      .attr('class', 'links')
      .attr('marker-end', d => d.type !== 'WIRE' ? 'url(#arrowhead)' : '')
      .attr('marker-start', d => d.bidirectional ? 'url(#arrowhead-start)' : '')
      .style("stroke-dasharray", d => d.type === 'AIR' ? '10,5' : '10,0') // make the stroke dashed
      .attr('stroke-width', '5')

    enter.append('lqi')
      .text(d => d.lqi);

    links = links.merge(enter);
    return links;

  }

  public createEdgePaths(dataset, merge: boolean = false): any {

    let edgepaths = this.svg.selectAll('.edgepath')
      .data(dataset);
    edgepaths.exit().remove();

    const enter = edgepaths.enter().append('path')
      .attr('class', 'edgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('stroke-width', '5')
      .attr('fill', '#aaa')
      .attr('id', function (d, i) { return 'edgepath' + i; })
      .style('pointer-events', 'none')

    edgepaths = edgepaths.merge(enter);
    return edgepaths;
  }

  public createEdgeLabels(dataset, merge: boolean = false): any {
    let edgelabels = this.svg.selectAll('.edgelabel')
      .data(dataset, function (d) { return d.source.id + '-' + d.target.id + '-' + d.status + '-' + d.lqi + '-' + d.lqibis; });
    edgelabels.exit().remove();

    const enter = edgelabels.enter().append('text')
      .style('pointer-events', 'auto')
      .attr('class', 'edgelabel')
      .attr('id', function (d, i) { return 'edgelabel' + i; })
      .attr('font-size', 10)
      .attr('font-weight', 'bold')
      .attr('dy', -2)

      .attr('fill', function (d) { return (d.lqi > 0 ? 'green' : 'red'); })
      .style('cursor', 'pointer');

    enter.append('textPath')
      .attr('xlink:href', function (d, i) { return '#edgepath' + i; })
      .style('text-anchor', 'middle')
      .style('pointer-events', 'auto')
      .attr('startOffset', '50%')
      .attr("class", "fa")
      .text(d => {
        return d.lqi && d.lqibis ? d.lqi + '\uf060' + '\uf061' + d.lqibis + 'bis' : (d.lqi ? d.lqi + '\uf060' : '');
      });

    enter.on('click', (d: any) => {
      console.log('test click link');
    });
    edgelabels = edgelabels.merge(enter);
    return edgelabels;
  }

  calculatePointText(elements: Array<any>) {
    const graph: any = d3Lib.select('#dragCt');
    const pg = graph.node().getBBox();
    let coordinatorG = graph.selectAll('.nodes')._groups[0][0];

    for (const key in graph.selectAll('.nodes')._groups[0]) {
      if (graph.selectAll('.nodes')._groups[0].hasOwnProperty(key)) {
        const node = graph.selectAll('.nodes')._groups[0][key];
        if (node.__data__.type === 'COORDINATOR') {
          coordinatorG = node;
          break;
        }
      }
    }

    const coordinatorPoint = coordinatorG.getBoundingClientRect();

    const testPointx = (Math.abs(pg.x) + pg.width) / 2;
    const testPointy = (Math.abs(pg.y) + pg.height) / 2;

    elements.forEach(element => {
      const node = d3Lib.select(element);
      const nodePoint = node.node().getBoundingClientRect();
      if ((node.data()[0] as any).type === 'MODULE') {
        if (nodePoint.x > coordinatorPoint.x) {
          node.select('text').attr('dx', 0);
        } else {
          const p = (node.select('text').node() as any).getBBox();
          node.select('text').attr('dx', -(0 + p.width));
        }

        if (nodePoint.y < coordinatorPoint.y) {
          node.select('text').attr('dy', -17);
        } else {
          node.select('text').attr('dy', 27);
        }
      }
    });
  }

  public createNodes(dataset, merge: boolean = false): any {
    const _this = this;

    let nodes = this.svg.selectAll('.nodes')
      .data(dataset, function (d) { return d.id + '-' + d.status; });
    nodes.exit().remove();

    const enter = nodes.enter().append('g')
      .attr('class', 'nodes')
      .call(this.d3.drag()
        .on('start', (d: any) => {
          if (!d3Lib.event.active) {
            this.simulation$.alphaTarget(0.1).restart();
          }
          d.fy = d.y;
          d.fx = d.x;
        })
        .on('drag', function (d: any) {
          d.fx = d3Lib.event.x;
          d.fy = d3Lib.event.y;
          _this.calculatePointText([this]);
        })
      );

    function trimText(text, threshold) {
      if (text.length <= threshold) return text;
      return text.substr(0, threshold).concat('...');
    }

    enter.append('circle')
      .attr('r', d => 15)
      .style('stroke', function (d) { return d.type === 'ROUTER' || d.type === 'ENDDEVICE' ? '#86d698' : 'grey'; }) //#86d698 green #ff0018 red #fd9b4a orange
      .style('stroke-opacity', function (d) { return d.type === 'ROUTER' || d.type === 'ENDDEVICE' ? 1 : 0.3; })
      .style('stroke-width', (d: any) => d.type === 'ROUTER' || d.type === 'ENDDEVICE' ? 4 : 10) //d.runtime / 10
      //.style("stroke-dasharray", (d) => { return d.status === 'ACTIF' ? '10,0' : '10,5' }) // make the stroke dashed
      .style('fill', (d: any) => {
        if (d.status === 'SLEEPY' || d.status === 'INACTIF') {
          return 'grey';
        }
        return this.colorScale()(d.type);
      })
      .style('cursor', 'pointer');

    enter.append('title')
      .text(d => d.id + ': ' + d.name + ' - ' + d.type + ', runtime:' + 10 + 'min');

    enter.append('text')
      .attr('dy', function () { return 5; })
      .attr('dx', function () { return -7; })
      .style('fill', 'rgb(95, 94, 94)')
      .style('font-weight', 600)
      .text(x => trimText(x.name, 10));

    enter.on('click', (d: any) => {
      console.log('test click node');
      this.revealed.visible = !this.revealed.visible;
    });
    nodes = nodes.merge(enter);
    return nodes;
  }



  public initSvg() {
    this.width = this.isMobile ? 65 : 70;
    this.height = this.isMobile ? 63 : 63;

    if (!this.svg) {
      this.svg = this.d3.select('div#container')
        .append('svg')
        .attr('width', `${this.width}vw`)
        .attr('height', `${this.height}vh`)
        .classed('svg-content', true)
        .append('g')
        .attr('id', 'dragCt')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('transform', `translate(${this.getMargin().left},${this.getMargin().top})`);

      this.svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
        .attr('refX', 23) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');

      this.svg.append('defs').append('marker')
        .attr('id', 'arrowhead-start')
        .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
        .attr('refX', -13) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,0 L 10 ,-5 L 10,5')
        .attr('fill', '#999')
        .style('stroke', 'none');

    }

    this.initLegend();
    // function drag_this() {
    //   return d3Lib.drag().subject(this)
    //     .on('start', function (d: any) {
    //       if (d.x1) {
    //         d.x1 = d3Lib.event.x - d.xt;
    //         d.y1 = d3Lib.event.y - d.yt;
    //       } else {
    //         d.x1 = d3Lib.event.x;
    //         d.y1 = d3Lib.event.y;
    //       }
    //     })
    //     .on('drag', function (d: any) {
    //       d3Lib.select(this)
    //         .attr("transform", "translate(" + (d3Lib.event.x - d.x1) + "," + (d3Lib.event.y - d.y1) + ")");

    //       d.xt = d3Lib.event.x - d.x1;
    //       d.yt = d3Lib.event.y - d.y1;
    //     });
    // }
    // this.svg.call(drag_this);
  }


  public initLegend() {
    this.legend = this.d3.select('div#legendcontainer')
      .append('svg')
      .attr('width', `${this.isMobile ? 86 : 140}px`)
      .attr('height', `${600}px`)
      .classed('svg-content', true)
      .append('g')
      .attr('id', 'dragCt')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('transform', `translate(${7},${50})  ${this.isMobile ? 'scale(0.6)' : ''}`);

    const titleGroupeDevice = this.legend.append('g')
      .attr('transform', `translate(${7}, 0)`);
    titleGroupeDevice.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .style('font-weight', 600)
      .style('fill', 'rgb(95, 94, 94)')
      .text('Device');

    const legend_g = this.legend.selectAll('.legend')
      .data(this.colorScale().domain())
      .enter().append('g')
      .attr('transform', (d, i) => `translate(${7},${20 + (i * 20)})`);

    legend_g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .attr('fill', this.colorScale());

    legend_g.append('text')
      .attr('x', 10)
      .attr('y', 5)
      .text((d: any) => d);

    const groupeTitleBattery = this.legend.append('g')
      .attr('transform', `translate(${7}, 140)`);
    groupeTitleBattery.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .style('font-weight', 600)
      .style('fill', 'rgb(95, 94, 94)')
      .text('Power supply');

    const legend_g1 = this.legend.selectAll('.legend')
      .data(this.batteryLevel().domain())
      .enter().append('g')
      .attr('transform', (d, i) => `translate(${7},${160 + (i * 20)})`);

    legend_g1.append('circle')
      .attr('r', 7)
      .attr('cx', 0)
      .attr('cy', 0)
      .style('stroke', this.batteryLevel())
      .style('stroke-opacity', 0.7)
      .style('stroke-width', 5)
      .style('fill', 'grey');
    legend_g1.append('text')
      .attr('x', 10)
      .attr('y', 5)
      .text((d: any) => d);


    const groupeTitleLinks = this.legend.append('g')
      .attr('transform', `translate(${7}, 240)`);
    groupeTitleLinks.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .style('font-weight', 600)
      .style('fill', 'rgb(95, 94, 94)')
      .text('Links');

    const legend_g3 = this.legend.selectAll('.legend')
      .data(this.linkType().domain())
      .enter().append('g')
      .attr('transform', (d, i) => `translate(${7},${260 + (i * 20)})`);

    legend_g3.append('line')
      .style("stroke-dasharray", d => d === 'WIRELESS' ? '5,2.5' : d === 'ACTIVE' || d === 'INACTIVE' ? '5,2.5,5,2.5,12' : '5,0')
      .attr("x1", -8)
      .attr("y1", -1.5)
      .attr("x2", 18)
      .attr("y2", -1.5)
      .attr("stroke-width", 2)
      .attr("stroke", this.linkType());
    legend_g3.append('text')
      .attr('x', 26)
      .attr('y', 5)
      .text((d: any) => d);

    const direction = this.legend.append('g')
      .attr('transform', `translate(${7}, 345)`);
    direction.append('text')
      .attr('x', -8)
      .attr('y', 0)
      .attr('fill', d => '#86d698')
      .attr("class", "fa")
      .text('(x)\uf060');

    direction.append('text')
      .attr('x', 26)
      .attr('y', 0)
      .text('Lqi direction');


    // legend_g1.append('circle')
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .attr('r', 5)
    //   .attr('fill', this.batteryLevel());

    // legend_g1.append('text')
    //   .attr('x', 10)
    //   .attr('y', 5)
    //   .text((d: any) => d);


    // const legend_g2 = this.legend.append('g')
    //   .attr('transform', `translate(${7}, 120)`);

    // legend_g2.append('circle')
    //   .attr('r', 5)
    //   .attr('cx', 0)
    //   .attr('cy', 0)
    //   .style('stroke', 'grey')
    //   .style('stroke-opacity', 0.3)
    //   .style('stroke-width', 15)
    //   .style('fill', 'black');
    // legend_g2.append('text')
    //   .attr('x', 15)
    //   .attr('y', 0)
    //   .text('long runtime');

    // legend_g2.append('circle')
    //   .attr('r', 5)
    //   .attr('cx', 0)
    //   .attr('cy', 20)
    //   .style('stroke', 'grey')
    //   .style('stroke-opacity', 0.3)
    //   .style('stroke-width', 2)
    //   .style('fill', 'black');
    // legend_g2.append('text')
    //   .attr('x', 15)
    //   .attr('y', 20)
    //   .text('short runtime');
  }

  public getMargin() {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  public getWidth() {
    const margin = this.getMargin();
    return this.vwTOpx(this.width) - margin.left - margin.right;
  }

  public getHeight() {
    const margin = this.getMargin();
    return this.vhTOpx(this.height) - margin.top - margin.bottom;
  }

  public pxTOvw(value) {
    var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight || e.clientHeight || g.clientHeight;

    var result = (100 * value) / x;
    return result;
  }

  public pxTOvh(value) {
    var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth,
      y = w.innerHeight || e.clientHeight || g.clientHeight;

    var result = (100 * value) / y;
    return result;
  }

  public getWidthLegend(width) {
    const margin = this.getMargin();
    return this.vwTOpx(width) - margin.left - margin.right;
  }

  public getHeightLegend(height) {
    const margin = this.getMargin();
    return this.vhTOpx(height) - margin.top - margin.bottom;
  }

  public vwTOpx(value) {
    let w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth;

    let result = (x * value) / 100;
    return (result);
  }

  buildViewBoxAttribute() {
    //return `0 0 ${this.vwTOpx(45)} 20`;
    return `0 0 10 10`;
  }

  public vhTOpx(value) {
    let w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      y = w.innerHeight || e.clientHeight || g.clientHeight;

    let result = (y * value) / 100;
    return (result);
  }

  public colorScale() {
    return this.d3.scaleOrdinal() //=d3.scaleOrdinal(d3.schemeSet2)
      .domain(['COORDINATOR', 'ROUTER', 'ENDDEVICE', 'MODULE', 'INACTIVE'])
      .range(['#9e79db', '#fff178', '#52a0f7', '#abe5ff', 'grey']) as any;
  }

  public batteryLevel() {
    return this.d3.scaleOrdinal() //=d3.scaleOrdinal(d3.schemeSet2)
      .domain(['HIGH', 'HALF', 'LOW'])
      .range(['#86d698', '#fd9b4a', '#ff0018']) as any; // green #ff0018 red #fd9b4a orange
  }

  public linkType() {
    return this.d3.scaleOrdinal() //=d3.scaleOrdinal(d3.schemeSet2)
      .domain(['WIRELESS', 'WIRED', 'ACTIVE', 'INACTIVE'])
      .range(['#86d698', '#86d698', '#86d698', 'grey']) as any; // green #ff0018 red #fd9b4a orange
  }

}
