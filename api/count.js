const data = JSON.parse('{"1973":3,"1974":1288,"1975":1210,"1976":909,"1977":627,"1978":379,"1979":581,"1980":726,"1981":392,"1982":494,"1983":442,"1984":597,"1985":362,"1986":820,"1987":372,"1988":450,"1989":1203,"1990":1092,"1991":391,"1992":266,"1993":312,"1994":306,"1995":461,"1996":349,"1997":401,"1998":450,"1999":369,"2000":326,"2001":362,"2002":438,"2003":384,"2004":436,"2005":324,"2006":322,"2007":389,"2008":351,"2009":340,"2010":319,"2011":399,"2012":297,"2013":282,"2014":389,"2015":378,"2016":305,"2017":368,"2018":357,"2019":306,"2020":320,"2021":385,"2022":311,"2023":219}');

var total = 0;

for (var year in data) {
    total += data[year];
}

console.log(total);