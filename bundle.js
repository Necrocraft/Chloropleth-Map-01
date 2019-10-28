const svg = d3.select("svg");

const spacing = 20;
const xOffset = 15;
const circleRadius = 8;

const projection = d3.geoNaturalEarth1();
const pathGenerator = d3.geoPath().projection(projection);

const g = svg.append('g');

const colorLegendG = svg.append('g')
        .attr("transform", "translate(" + 30 + ", " + 300 + ")");

var tooltip = d3.select("body")
                    .append("div")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden")
                    .attr("class", "d3tooltip")
                    .text("a simple tooltip");

svg.call(d3.zoom().on('zoom', () => {
    g.attr('transform', d3.event.transform);
}));

g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({type: 'Sphere'}));

const colorScale = d3.scaleOrdinal();
    
Promise.all([
    d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.tsv'),
    d3.json("https://unpkg.com/world-atlas@1.1.4/world/50m.json")
]).then(([tsvData, topojsonData]) => {
    const rowById = {};
    tsvData.forEach(d => {
        rowById[d.iso_n3] = d;
    }
    );
    const countries = topojson.feature(topojsonData, topojsonData.objects.countries);

    countries.features.forEach(d => {
        Object.assign(d.properties, rowById[d.id]);
    });

    const colorValue = d => d.properties.economy; // Just change this to see different properties like income_grp, continent

    colorScale.domain(countries.features.map(colorValue).sort().reverse())
        .range(d3.schemeSpectral[colorScale.domain().length]);

    //Color Legend Start

    const rectangle = colorLegendG.selectAll('rect')
                        .data([null])
                        .enter().append('rect')
                        .attr('x', -circleRadius * 2)
                        .attr('y', -circleRadius * 2)
                        .attr('width', 225)
                        .attr('height', spacing * colorScale.domain().length + circleRadius * 2)
                        .attr('fill', 'white')
                        .attr('rx', circleRadius * 2)
                        .attr('opacity', 0.7);

    const legendG = colorLegendG.append('g')
                        .attr('class', 'groups');

    const circles = legendG.selectAll('circle')
                        .data(colorScale.domain())
                        .enter().append('circle')
                        .attr('class', 'group')
                        .attr('cy', (d, i) => i * spacing)
                        .attr('r', circleRadius)
                        .attr('fill', colorScale);
                        

    const text = legendG.selectAll('text')
                        .data(colorScale.domain())
                        .enter().append('text')
                        .attr('class', 'tick')
                        .text(d => d)
                        .attr('y', (d, i) => i * spacing)
                        .attr('x', xOffset)
                        .attr('dy', '0.32em');

    //Color Legend Ends

    g
    .selectAll("path")
    .data(countries.features)
    .enter()
    .append("path")
        .attr("class", "country")
        .attr("d", pathGenerator)
        .attr('fill', d => colorScale(colorValue(d)))
        .on("mouseover", function(d){tooltip.html((d.properties.name + "<br/>" + colorValue(d))); return tooltip.style("visibility", "visible");})
        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
});