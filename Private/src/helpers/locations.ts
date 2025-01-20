const LOCATIONS: { [key: string]: string } = {
    "bigmap": "Customs",
    "Sandbox": "Ground Zero",
    "Sandbox_high": "Ground Zero",
    "develop": "Ground Zero",
    "factory4_day": "Factory",
    "factory4_night": "Factory",
    "hideout": "Hideout",
    "Interchange": "Interchange",
    "laboratory": "Laboratory",
    "Lighthouse": "Lighthouse",
    "privatearea": "Private Area",
    "RezervBase": "Reserve",
    "Shoreline": "Shoreline",
    "suburbs": "Suburbs",
    "TarkovStreets": "Streets",
    "terminal": "Terminal",
    "town": "Town",
    "Woods": "Woods",
    "base": "Base"
};

function getLocation(locationString: string) {
    return LOCATIONS[locationString] || locationString
}

export {
    LOCATIONS,
    getLocation
}