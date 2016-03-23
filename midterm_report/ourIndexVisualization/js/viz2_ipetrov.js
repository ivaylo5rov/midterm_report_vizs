var formatHour = function(d) { 
  return d;
};

var margin = {top: 10, right: 20, bottom: 20, left: 80},
    width = 960 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;

var y0 = d3.scale.ordinal()
    .rangeRoundBands([height, 0], .2);

var y1 = d3.scale.linear();

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1, 0);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(formatHour);

var nest = d3.nest()
    .key(function(d) { 
      return d.category; });

var stack = d3.layout.stack()
    .values(function(d) { return d.values; })
    .x(function(d) { return d.date; })
    .y(function(d) { return d.value; })
    .out(function(d, y0) { d.valueOffset = y0; });

var color = d3.scale.category10();

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.tsv("data.tsv", function(error, data) {

  data.forEach(function(d) {
    d.hour = d.hour;
    d.value = +d.value;
  });

  var dataByCategory = nest.entries(data);

  stack(dataByCategory);
  x.domain(dataByCategory[0].values.map(function(d) { return d.hour; }));
  y0.domain(dataByCategory.map(function(d) { return d.key; }));
  y1.domain([0, d3.max(data, function(d) { return d.value; })]).range([y0.rangeBand(), 0]);

  var category = svg.selectAll(".category")
      .data(dataByCategory)
    .enter().append("g")
      .attr("class", "category")
      .attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });

  category.append("text")
      .attr("class", "category-label")
      .attr("x", -6)
      .attr("y", function(d) { return y1(d.values[0].value / 2); })
      .attr("dy", ".35em")
      .text(function(d) { 
        return d.key;
      });

  category.selectAll("rect")
      .data(function(d) { return d.values; })
    .enter().append("rect")
      .style("fill", function(d) { 
        return color(d.category); })
      .attr("x", function(d) { return x(d.hour); })
      .attr("y", function(d) { return y1(d.value); })
      .attr("width", x.rangeBand())
      .attr("height", function(d) { return y0.rangeBand() - y1(d.value); });

  category.filter(function(d, i) { return !i; }).append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + y0.rangeBand() + ")")
      .call(xAxis);

  d3.selectAll("input").on("change", change);

  var timeout = setTimeout(function() {
    d3.select("input[value=\"stacked\"]").property("checked", true).each(change);
  }, 2000);

  function change() {
    clearTimeout(timeout);
    if (this.value === "multiples") transitionMultiples();
    else transitionStacked();
  }

  function transitionMultiples() {
    var t = svg.transition().duration(750),
        g = t.selectAll(".category").attr("transform", function(d) { return "translate(0," + y0(d.key) + ")"; });
    g.selectAll("rect").attr("y", function(d) { return y1(d.value); });
    g.select(".category-label").attr("y", function(d) { return y1(d.values[0].value / 2); })
  }

  function transitionStacked() {
    var t = svg.transition().duration(750),
        g = t.selectAll(".category").attr("transform", "translate(0," + y0(y0.domain()[0]) + ")");
    g.selectAll("rect").attr("y", function(d) { return y1(d.value + d.valueOffset); });
    g.select(".category-label").attr("y", function(d) { return y1(d.values[0].value / 2 + d.values[0].valueOffset); })
  }

  // var sortTimeout = setTimeout(function() {
  //   d3.select("input").property("checked", true).each(change2);
  // }, 6000);

  // function change2() {
  //   clearTimeout(sortTimeout);

  //   // Copy-on-write since tweens are evaluated after a delay.
  //   var x0 = x.domain(data.sort(this.checked
  //       ? function(a, b) { 
  //         console.log(b);
  //         console.log(a);
  //         console.log("---------");
  //         return b.value - a.value; }
  //       : function(a, b) { return d3.ascending(a.hour, b.hour); })
  //       .map(function(d) { return d.hour; }))
  //       .copy();

  //   svg.selectAll(".bar")
  //       .sort(function(a, b) { return x0(a.hour) - x0(b.hour); });

  //   var transition = svg.transition().duration(750),
  //       delay = function(d, i) { return i * 50; };

  //   transition.selectAll(".bar")
  //       .delay(delay)
  //       .attr("x", function(d) { return x0(d.hour); });

  //   transition.select(".x.axis")
  //       .call(xAxis)
  //     .selectAll("g")
  //       .delay(delay);
  // }
});