import { Injectable } from '@nestjs/common';
import { Route } from './interfaces/route.interface';
import { generateId } from '../../common/utils/id.util';

@Injectable()
export class RouteRepository {
  private routes: Route[] = [
    {
      routeId: 'R001',
      source: 'Hyderabad',
      destination: 'Chennai',
      distance: 625,
    },
    {
      routeId: 'R002',
      source: 'Chennai',
      destination: 'Hyderabad',
      distance: 625,
    },
    {
      routeId: 'R003',
      source: 'Bangalore',
      destination: 'Mumbai',
      distance: 980,
    },
    {
      routeId: 'R004',
      source: 'Mumbai',
      destination: 'Bangalore',
      distance: 980,
    },
    { routeId: 'R005', source: 'Delhi', destination: 'Jaipur', distance: 270 },
    { routeId: 'R006', source: 'Jaipur', destination: 'Delhi', distance: 270 },
    {
      routeId: 'R007',
      source: 'Hyderabad',
      destination: 'Bangalore',
      distance: 560,
    },
    {
      routeId: 'R008',
      source: 'Bangalore',
      destination: 'Hyderabad',
      distance: 560,
    },
    {
      routeId: 'R009',
      source: 'Chennai',
      destination: 'Coimbatore',
      distance: 500,
    },
    {
      routeId: 'R010',
      source: 'Coimbatore',
      destination: 'Chennai',
      distance: 500,
    },
    { routeId: 'R011', source: 'Mumbai', destination: 'Pune', distance: 150 },
    { routeId: 'R012', source: 'Pune', destination: 'Mumbai', distance: 150 },
    {
      routeId: 'R013',
      source: 'Vijayawada',
      destination: 'Tirupati',
      distance: 340,
    },
    {
      routeId: 'R014',
      source: 'Tirupati',
      destination: 'Vijayawada',
      distance: 340,
    },
    {
      routeId: 'R015',
      source: 'Bangalore',
      destination: 'Mysore',
      distance: 140,
    },
    {
      routeId: 'R016',
      source: 'Mysore',
      destination: 'Bangalore',
      distance: 140,
    },
    { routeId: 'R017', source: 'Delhi', destination: 'Agra', distance: 200 },
    { routeId: 'R018', source: 'Agra', destination: 'Delhi', distance: 200 },
    {
      routeId: 'R019',
      source: 'Hyderabad',
      destination: 'Vijayawada',
      distance: 270,
    },
    {
      routeId: 'R020',
      source: 'Vijayawada',
      destination: 'Hyderabad',
      distance: 270,
    },
    {
      routeId: 'R021',
      source: 'Hyderabad',
      destination: 'Visakhapatnam',
      distance: 620,
    },
    {
      routeId: 'R022',
      source: 'Visakhapatnam',
      destination: 'Hyderabad',
      distance: 620,
    },
    {
      routeId: 'R023',
      source: 'Hyderabad',
      destination: 'Tirupati',
      distance: 550,
    },
    {
      routeId: 'R024',
      source: 'Tirupati',
      destination: 'Hyderabad',
      distance: 550,
    },
    {
      routeId: 'R025',
      source: 'Hyderabad',
      destination: 'Warangal',
      distance: 150,
    },
    {
      routeId: 'R026',
      source: 'Warangal',
      destination: 'Hyderabad',
      distance: 150,
    },
    {
      routeId: 'R027',
      source: 'Hyderabad',
      destination: 'Khammam',
      distance: 195,
    },
    {
      routeId: 'R028',
      source: 'Khammam',
      destination: 'Hyderabad',
      distance: 195,
    },
    {
      routeId: 'R029',
      source: 'Hyderabad',
      destination: 'Nizamabad',
      distance: 175,
    },
    {
      routeId: 'R030',
      source: 'Nizamabad',
      destination: 'Hyderabad',
      distance: 175,
    },
    {
      routeId: 'R031',
      source: 'Hyderabad',
      destination: 'Karimnagar',
      distance: 165,
    },
    {
      routeId: 'R032',
      source: 'Karimnagar',
      destination: 'Hyderabad',
      distance: 165,
    },
    {
      routeId: 'R033',
      source: 'Hyderabad',
      destination: 'Kurnool',
      distance: 215,
    },
    {
      routeId: 'R034',
      source: 'Kurnool',
      destination: 'Hyderabad',
      distance: 215,
    },
    {
      routeId: 'R035',
      source: 'Hyderabad',
      destination: 'Pune',
      distance: 560,
    },
    {
      routeId: 'R036',
      source: 'Pune',
      destination: 'Hyderabad',
      distance: 560,
    },
    {
      routeId: 'R037',
      source: 'Hyderabad',
      destination: 'Mumbai',
      distance: 710,
    },
    {
      routeId: 'R038',
      source: 'Mumbai',
      destination: 'Hyderabad',
      distance: 710,
    },
    { routeId: 'R039', source: 'Hyderabad', destination: 'Goa', distance: 650 },
    { routeId: 'R040', source: 'Goa', destination: 'Hyderabad', distance: 650 },
    {
      routeId: 'R041',
      source: 'Hyderabad',
      destination: 'Shirdi',
      distance: 600,
    },
    {
      routeId: 'R042',
      source: 'Shirdi',
      destination: 'Hyderabad',
      distance: 600,
    },
    {
      routeId: 'R043',
      source: 'Hyderabad',
      destination: 'Nagpur',
      distance: 500,
    },
    {
      routeId: 'R044',
      source: 'Nagpur',
      destination: 'Hyderabad',
      distance: 500,
    },
    {
      routeId: 'R045',
      source: 'Vijayawada',
      destination: 'Visakhapatnam',
      distance: 350,
    },
    {
      routeId: 'R046',
      source: 'Visakhapatnam',
      destination: 'Vijayawada',
      distance: 350,
    },
    {
      routeId: 'R047',
      source: 'Vijayawada',
      destination: 'Chennai',
      distance: 450,
    },
    {
      routeId: 'R048',
      source: 'Chennai',
      destination: 'Vijayawada',
      distance: 450,
    },
    {
      routeId: 'R049',
      source: 'Vijayawada',
      destination: 'Bangalore',
      distance: 650,
    },
    {
      routeId: 'R050',
      source: 'Bangalore',
      destination: 'Vijayawada',
      distance: 650,
    },
    {
      routeId: 'R051',
      source: 'Vijayawada',
      destination: 'Guntur',
      distance: 35,
    },
    {
      routeId: 'R052',
      source: 'Guntur',
      destination: 'Vijayawada',
      distance: 35,
    },
    {
      routeId: 'R053',
      source: 'Vijayawada',
      destination: 'Rajahmundry',
      distance: 160,
    },
    {
      routeId: 'R054',
      source: 'Rajahmundry',
      destination: 'Vijayawada',
      distance: 160,
    },
    {
      routeId: 'R055',
      source: 'Vijayawada',
      destination: 'Kakinada',
      distance: 210,
    },
    {
      routeId: 'R056',
      source: 'Kakinada',
      destination: 'Vijayawada',
      distance: 210,
    },
    {
      routeId: 'R057',
      source: 'Vijayawada',
      destination: 'Nellore',
      distance: 280,
    },
    {
      routeId: 'R058',
      source: 'Nellore',
      destination: 'Vijayawada',
      distance: 280,
    },
    {
      routeId: 'R059',
      source: 'Visakhapatnam',
      destination: 'Bhubaneswar',
      distance: 440,
    },
    {
      routeId: 'R060',
      source: 'Bhubaneswar',
      destination: 'Visakhapatnam',
      distance: 440,
    },
    {
      routeId: 'R061',
      source: 'Visakhapatnam',
      destination: 'Rajahmundry',
      distance: 190,
    },
    {
      routeId: 'R062',
      source: 'Rajahmundry',
      destination: 'Visakhapatnam',
      distance: 190,
    },
    {
      routeId: 'R063',
      source: 'Tirupati',
      destination: 'Chennai',
      distance: 135,
    },
    {
      routeId: 'R064',
      source: 'Chennai',
      destination: 'Tirupati',
      distance: 135,
    },
    {
      routeId: 'R065',
      source: 'Tirupati',
      destination: 'Bangalore',
      distance: 250,
    },
    {
      routeId: 'R066',
      source: 'Bangalore',
      destination: 'Tirupati',
      distance: 250,
    },
    {
      routeId: 'R067',
      source: 'Tirupati',
      destination: 'Nellore',
      distance: 135,
    },
    {
      routeId: 'R068',
      source: 'Nellore',
      destination: 'Tirupati',
      distance: 135,
    },
    {
      routeId: 'R069',
      source: 'SriCity',
      destination: 'Chennai',
      distance: 75,
    },
    {
      routeId: 'R070',
      source: 'Chennai',
      destination: 'SriCity',
      distance: 75,
    },
    { routeId: 'R071', source: 'Tada', destination: 'Chennai', distance: 65 },
    { routeId: 'R072', source: 'Chennai', destination: 'Tada', distance: 65 },
    {
      routeId: 'R073',
      source: 'Tada',
      destination: 'Hyderabad',
      distance: 580,
    },
    {
      routeId: 'R074',
      source: 'Hyderabad',
      destination: 'Tada',
      distance: 580,
    },
    {
      routeId: 'R075',
      source: 'Bangalore',
      destination: 'Chennai',
      distance: 345,
    },
    {
      routeId: 'R076',
      source: 'Chennai',
      destination: 'Bangalore',
      distance: 345,
    },
    {
      routeId: 'R077',
      source: 'Bangalore',
      destination: 'Coimbatore',
      distance: 360,
    },
    {
      routeId: 'R078',
      source: 'Coimbatore',
      destination: 'Bangalore',
      distance: 360,
    },
    {
      routeId: 'R079',
      source: 'Bangalore',
      destination: 'Mangalore',
      distance: 350,
    },
    {
      routeId: 'R080',
      source: 'Mangalore',
      destination: 'Bangalore',
      distance: 350,
    },
    {
      routeId: 'R081',
      source: 'Bangalore',
      destination: 'Hubli',
      distance: 410,
    },
    {
      routeId: 'R082',
      source: 'Hubli',
      destination: 'Bangalore',
      distance: 410,
    },
    {
      routeId: 'R083',
      source: 'Bangalore',
      destination: 'Belgaum',
      distance: 505,
    },
    {
      routeId: 'R084',
      source: 'Belgaum',
      destination: 'Bangalore',
      distance: 505,
    },
    { routeId: 'R085', source: 'Bangalore', destination: 'Goa', distance: 560 },
    { routeId: 'R086', source: 'Goa', destination: 'Bangalore', distance: 560 },
    {
      routeId: 'R087',
      source: 'Bangalore',
      destination: 'Pune',
      distance: 840,
    },
    {
      routeId: 'R088',
      source: 'Pune',
      destination: 'Bangalore',
      distance: 840,
    },
    {
      routeId: 'R089',
      source: 'Bangalore',
      destination: 'Kochi',
      distance: 540,
    },
    {
      routeId: 'R090',
      source: 'Kochi',
      destination: 'Bangalore',
      distance: 540,
    },
    {
      routeId: 'R091',
      source: 'Bangalore',
      destination: 'Calicut',
      distance: 360,
    },
    {
      routeId: 'R092',
      source: 'Calicut',
      destination: 'Bangalore',
      distance: 360,
    },
    {
      routeId: 'R093',
      source: 'Bangalore',
      destination: 'Ooty',
      distance: 275,
    },
    {
      routeId: 'R094',
      source: 'Ooty',
      destination: 'Bangalore',
      distance: 275,
    },
    {
      routeId: 'R095',
      source: 'Bangalore',
      destination: 'Pondicherry',
      distance: 310,
    },
    {
      routeId: 'R096',
      source: 'Pondicherry',
      destination: 'Bangalore',
      distance: 310,
    },
    {
      routeId: 'R097',
      source: 'Bangalore',
      destination: 'Salem',
      distance: 200,
    },
    {
      routeId: 'R098',
      source: 'Salem',
      destination: 'Bangalore',
      distance: 200,
    },
    {
      routeId: 'R099',
      source: 'Bangalore',
      destination: 'Madurai',
      distance: 435,
    },
    {
      routeId: 'R100',
      source: 'Madurai',
      destination: 'Bangalore',
      distance: 435,
    },
    {
      routeId: 'R101',
      source: 'Bangalore',
      destination: 'Udupi',
      distance: 400,
    },
    {
      routeId: 'R102',
      source: 'Udupi',
      destination: 'Bangalore',
      distance: 400,
    },
    {
      routeId: 'R103',
      source: 'Chennai',
      destination: 'Madurai',
      distance: 460,
    },
    {
      routeId: 'R104',
      source: 'Madurai',
      destination: 'Chennai',
      distance: 460,
    },
    {
      routeId: 'R105',
      source: 'Chennai',
      destination: 'Pondicherry',
      distance: 150,
    },
    {
      routeId: 'R106',
      source: 'Pondicherry',
      destination: 'Chennai',
      distance: 150,
    },
    { routeId: 'R107', source: 'Chennai', destination: 'Salem', distance: 340 },
    { routeId: 'R108', source: 'Salem', destination: 'Chennai', distance: 340 },
    {
      routeId: 'R109',
      source: 'Chennai',
      destination: 'Tiruchirappalli',
      distance: 330,
    },
    {
      routeId: 'R110',
      source: 'Tiruchirappalli',
      destination: 'Chennai',
      distance: 330,
    },
    {
      routeId: 'R111',
      source: 'Chennai',
      destination: 'Vellore',
      distance: 140,
    },
    {
      routeId: 'R112',
      source: 'Vellore',
      destination: 'Chennai',
      distance: 140,
    },
    {
      routeId: 'R113',
      source: 'Chennai',
      destination: 'Kanyakumari',
      distance: 700,
    },
    {
      routeId: 'R114',
      source: 'Kanyakumari',
      destination: 'Chennai',
      distance: 700,
    },
    {
      routeId: 'R115',
      source: 'Chennai',
      destination: 'Rameswaram',
      distance: 560,
    },
    {
      routeId: 'R116',
      source: 'Rameswaram',
      destination: 'Chennai',
      distance: 560,
    },
    {
      routeId: 'R117',
      source: 'Coimbatore',
      destination: 'Ooty',
      distance: 85,
    },
    {
      routeId: 'R118',
      source: 'Ooty',
      destination: 'Coimbatore',
      distance: 85,
    },
    {
      routeId: 'R119',
      source: 'Coimbatore',
      destination: 'Madurai',
      distance: 215,
    },
    {
      routeId: 'R120',
      source: 'Madurai',
      destination: 'Coimbatore',
      distance: 215,
    },
    {
      routeId: 'R121',
      source: 'Coimbatore',
      destination: 'Salem',
      distance: 165,
    },
    {
      routeId: 'R122',
      source: 'Salem',
      destination: 'Coimbatore',
      distance: 165,
    },
    {
      routeId: 'R123',
      source: 'Coimbatore',
      destination: 'Kochi',
      distance: 190,
    },
    {
      routeId: 'R124',
      source: 'Kochi',
      destination: 'Coimbatore',
      distance: 190,
    },
    {
      routeId: 'R125',
      source: 'Madurai',
      destination: 'Kodaikanal',
      distance: 115,
    },
    {
      routeId: 'R126',
      source: 'Kodaikanal',
      destination: 'Madurai',
      distance: 115,
    },
    {
      routeId: 'R127',
      source: 'Madurai',
      destination: 'Rameswaram',
      distance: 170,
    },
    {
      routeId: 'R128',
      source: 'Rameswaram',
      destination: 'Madurai',
      distance: 170,
    },
    {
      routeId: 'R129',
      source: 'Madurai',
      destination: 'Tirunelveli',
      distance: 160,
    },
    {
      routeId: 'R130',
      source: 'Tirunelveli',
      destination: 'Madurai',
      distance: 160,
    },
    { routeId: 'R131', source: 'Kochi', destination: 'Munnar', distance: 130 },
    { routeId: 'R132', source: 'Munnar', destination: 'Kochi', distance: 130 },
    {
      routeId: 'R133',
      source: 'Kochi',
      destination: 'Thiruvananthapuram',
      distance: 205,
    },
    {
      routeId: 'R134',
      source: 'Thiruvananthapuram',
      destination: 'Kochi',
      distance: 205,
    },
    { routeId: 'R135', source: 'Kochi', destination: 'Calicut', distance: 180 },
    { routeId: 'R136', source: 'Calicut', destination: 'Kochi', distance: 180 },
    {
      routeId: 'R137',
      source: 'Kochi',
      destination: 'Alappuzha',
      distance: 55,
    },
    {
      routeId: 'R138',
      source: 'Alappuzha',
      destination: 'Kochi',
      distance: 55,
    },
    { routeId: 'R139', source: 'Mumbai', destination: 'Goa', distance: 590 },
    { routeId: 'R140', source: 'Goa', destination: 'Mumbai', distance: 590 },
    { routeId: 'R141', source: 'Mumbai', destination: 'Shirdi', distance: 240 },
    { routeId: 'R142', source: 'Shirdi', destination: 'Mumbai', distance: 240 },
    { routeId: 'R143', source: 'Mumbai', destination: 'Nashik', distance: 165 },
    { routeId: 'R144', source: 'Nashik', destination: 'Mumbai', distance: 165 },
    { routeId: 'R145', source: 'Mumbai', destination: 'Surat', distance: 280 },
    { routeId: 'R146', source: 'Surat', destination: 'Mumbai', distance: 280 },
    {
      routeId: 'R147',
      source: 'Mumbai',
      destination: 'Ahmedabad',
      distance: 530,
    },
    {
      routeId: 'R148',
      source: 'Ahmedabad',
      destination: 'Mumbai',
      distance: 530,
    },
    {
      routeId: 'R149',
      source: 'Mumbai',
      destination: 'Kolhapur',
      distance: 380,
    },
    {
      routeId: 'R150',
      source: 'Kolhapur',
      destination: 'Mumbai',
      distance: 380,
    },
    {
      routeId: 'R151',
      source: 'Mumbai',
      destination: 'Mahabaleshwar',
      distance: 260,
    },
    {
      routeId: 'R152',
      source: 'Mahabaleshwar',
      destination: 'Mumbai',
      distance: 260,
    },
    { routeId: 'R153', source: 'Mumbai', destination: 'Nagpur', distance: 820 },
    { routeId: 'R154', source: 'Nagpur', destination: 'Mumbai', distance: 820 },
    {
      routeId: 'R155',
      source: 'Mumbai',
      destination: 'Aurangabad',
      distance: 335,
    },
    {
      routeId: 'R156',
      source: 'Aurangabad',
      destination: 'Mumbai',
      distance: 335,
    },
    { routeId: 'R157', source: 'Pune', destination: 'Goa', distance: 450 },
    { routeId: 'R158', source: 'Goa', destination: 'Pune', distance: 450 },
    { routeId: 'R159', source: 'Pune', destination: 'Shirdi', distance: 205 },
    { routeId: 'R160', source: 'Shirdi', destination: 'Pune', distance: 205 },
    { routeId: 'R161', source: 'Pune', destination: 'Kolhapur', distance: 235 },
    { routeId: 'R162', source: 'Kolhapur', destination: 'Pune', distance: 235 },
    {
      routeId: 'R163',
      source: 'Pune',
      destination: 'Mahabaleshwar',
      distance: 120,
    },
    {
      routeId: 'R164',
      source: 'Mahabaleshwar',
      destination: 'Pune',
      distance: 120,
    },
    {
      routeId: 'R165',
      source: 'Pune',
      destination: 'Aurangabad',
      distance: 235,
    },
    {
      routeId: 'R166',
      source: 'Aurangabad',
      destination: 'Pune',
      distance: 235,
    },
    { routeId: 'R167', source: 'Pune', destination: 'Nashik', distance: 210 },
    { routeId: 'R168', source: 'Nashik', destination: 'Pune', distance: 210 },
    { routeId: 'R169', source: 'Pune', destination: 'Nagpur', distance: 710 },
    { routeId: 'R170', source: 'Nagpur', destination: 'Pune', distance: 710 },
    {
      routeId: 'R171',
      source: 'Ahmedabad',
      destination: 'Surat',
      distance: 260,
    },
    {
      routeId: 'R172',
      source: 'Surat',
      destination: 'Ahmedabad',
      distance: 260,
    },
    {
      routeId: 'R173',
      source: 'Ahmedabad',
      destination: 'Vadodara',
      distance: 110,
    },
    {
      routeId: 'R174',
      source: 'Vadodara',
      destination: 'Ahmedabad',
      distance: 110,
    },
    {
      routeId: 'R175',
      source: 'Ahmedabad',
      destination: 'Rajkot',
      distance: 215,
    },
    {
      routeId: 'R176',
      source: 'Rajkot',
      destination: 'Ahmedabad',
      distance: 215,
    },
    {
      routeId: 'R177',
      source: 'Ahmedabad',
      destination: 'Udaipur',
      distance: 260,
    },
    {
      routeId: 'R178',
      source: 'Udaipur',
      destination: 'Ahmedabad',
      distance: 260,
    },
    {
      routeId: 'R179',
      source: 'Ahmedabad',
      destination: 'Jaipur',
      distance: 670,
    },
    {
      routeId: 'R180',
      source: 'Jaipur',
      destination: 'Ahmedabad',
      distance: 670,
    },
    {
      routeId: 'R181',
      source: 'Ahmedabad',
      destination: 'Indore',
      distance: 390,
    },
    {
      routeId: 'R182',
      source: 'Indore',
      destination: 'Ahmedabad',
      distance: 390,
    },
    {
      routeId: 'R183',
      source: 'Delhi',
      destination: 'Chandigarh',
      distance: 245,
    },
    {
      routeId: 'R184',
      source: 'Chandigarh',
      destination: 'Delhi',
      distance: 245,
    },
    {
      routeId: 'R185',
      source: 'Delhi',
      destination: 'Dehradun',
      distance: 255,
    },
    {
      routeId: 'R186',
      source: 'Dehradun',
      destination: 'Delhi',
      distance: 255,
    },
    {
      routeId: 'R187',
      source: 'Delhi',
      destination: 'Haridwar',
      distance: 220,
    },
    {
      routeId: 'R188',
      source: 'Haridwar',
      destination: 'Delhi',
      distance: 220,
    },
    {
      routeId: 'R189',
      source: 'Delhi',
      destination: 'Rishikesh',
      distance: 240,
    },
    {
      routeId: 'R190',
      source: 'Rishikesh',
      destination: 'Delhi',
      distance: 240,
    },
    { routeId: 'R191', source: 'Delhi', destination: 'Shimla', distance: 345 },
    { routeId: 'R192', source: 'Shimla', destination: 'Delhi', distance: 345 },
    { routeId: 'R193', source: 'Delhi', destination: 'Manali', distance: 530 },
    { routeId: 'R194', source: 'Manali', destination: 'Delhi', distance: 530 },
    {
      routeId: 'R195',
      source: 'Delhi',
      destination: 'Amritsar',
      distance: 450,
    },
    {
      routeId: 'R196',
      source: 'Amritsar',
      destination: 'Delhi',
      distance: 450,
    },
    {
      routeId: 'R197',
      source: 'Delhi',
      destination: 'Ludhiana',
      distance: 310,
    },
    {
      routeId: 'R198',
      source: 'Ludhiana',
      destination: 'Delhi',
      distance: 310,
    },
    { routeId: 'R199', source: 'Delhi', destination: 'Lucknow', distance: 550 },
    { routeId: 'R200', source: 'Lucknow', destination: 'Delhi', distance: 550 },
    { routeId: 'R201', source: 'Delhi', destination: 'Kanpur', distance: 490 },
    { routeId: 'R202', source: 'Kanpur', destination: 'Delhi', distance: 490 },
    {
      routeId: 'R203',
      source: 'Delhi',
      destination: 'Varanasi',
      distance: 820,
    },
    {
      routeId: 'R204',
      source: 'Varanasi',
      destination: 'Delhi',
      distance: 820,
    },
    {
      routeId: 'R205',
      source: 'Jaipur',
      destination: 'Udaipur',
      distance: 390,
    },
    {
      routeId: 'R206',
      source: 'Udaipur',
      destination: 'Jaipur',
      distance: 390,
    },
    {
      routeId: 'R207',
      source: 'Jaipur',
      destination: 'Jodhpur',
      distance: 330,
    },
    {
      routeId: 'R208',
      source: 'Jodhpur',
      destination: 'Jaipur',
      distance: 330,
    },
    { routeId: 'R209', source: 'Jaipur', destination: 'Ajmer', distance: 135 },
    { routeId: 'R210', source: 'Ajmer', destination: 'Jaipur', distance: 135 },
    { routeId: 'R211', source: 'Jaipur', destination: 'Kota', distance: 250 },
    { routeId: 'R212', source: 'Kota', destination: 'Jaipur', distance: 250 },
    { routeId: 'R213', source: 'Agra', destination: 'Lucknow', distance: 335 },
    { routeId: 'R214', source: 'Lucknow', destination: 'Agra', distance: 335 },
    { routeId: 'R215', source: 'Lucknow', destination: 'Kanpur', distance: 80 },
    { routeId: 'R216', source: 'Kanpur', destination: 'Lucknow', distance: 80 },
    {
      routeId: 'R217',
      source: 'Lucknow',
      destination: 'Varanasi',
      distance: 310,
    },
    {
      routeId: 'R218',
      source: 'Varanasi',
      destination: 'Lucknow',
      distance: 310,
    },
    {
      routeId: 'R219',
      source: 'Lucknow',
      destination: 'Prayagraj',
      distance: 200,
    },
    {
      routeId: 'R220',
      source: 'Prayagraj',
      destination: 'Lucknow',
      distance: 200,
    },
    {
      routeId: 'R221',
      source: 'Varanasi',
      destination: 'Prayagraj',
      distance: 120,
    },
    {
      routeId: 'R222',
      source: 'Prayagraj',
      destination: 'Varanasi',
      distance: 120,
    },
    {
      routeId: 'R223',
      source: 'Chandigarh',
      destination: 'Shimla',
      distance: 110,
    },
    {
      routeId: 'R224',
      source: 'Shimla',
      destination: 'Chandigarh',
      distance: 110,
    },
    {
      routeId: 'R225',
      source: 'Chandigarh',
      destination: 'Manali',
      distance: 290,
    },
    {
      routeId: 'R226',
      source: 'Manali',
      destination: 'Chandigarh',
      distance: 290,
    },
    {
      routeId: 'R227',
      source: 'Chandigarh',
      destination: 'Amritsar',
      distance: 230,
    },
    {
      routeId: 'R228',
      source: 'Amritsar',
      destination: 'Chandigarh',
      distance: 230,
    },
    { routeId: 'R229', source: 'Indore', destination: 'Bhopal', distance: 195 },
    { routeId: 'R230', source: 'Bhopal', destination: 'Indore', distance: 195 },
    {
      routeId: 'R231',
      source: 'Bhopal',
      destination: 'Jabalpur',
      distance: 315,
    },
    {
      routeId: 'R232',
      source: 'Jabalpur',
      destination: 'Bhopal',
      distance: 315,
    },
    {
      routeId: 'R233',
      source: 'Kolkata',
      destination: 'Siliguri',
      distance: 560,
    },
    {
      routeId: 'R234',
      source: 'Siliguri',
      destination: 'Kolkata',
      distance: 560,
    },
    {
      routeId: 'R235',
      source: 'Kolkata',
      destination: 'Bhubaneswar',
      distance: 440,
    },
    {
      routeId: 'R236',
      source: 'Bhubaneswar',
      destination: 'Kolkata',
      distance: 440,
    },
    { routeId: 'R237', source: 'Kolkata', destination: 'Puri', distance: 500 },
    { routeId: 'R238', source: 'Puri', destination: 'Kolkata', distance: 500 },
    {
      routeId: 'R239',
      source: 'Kolkata',
      destination: 'Ranchi',
      distance: 400,
    },
    {
      routeId: 'R240',
      source: 'Ranchi',
      destination: 'Kolkata',
      distance: 400,
    },
    { routeId: 'R241', source: 'Kolkata', destination: 'Patna', distance: 580 },
    { routeId: 'R242', source: 'Patna', destination: 'Kolkata', distance: 580 },
    {
      routeId: 'R243',
      source: 'Bhubaneswar',
      destination: 'Puri',
      distance: 65,
    },
    {
      routeId: 'R244',
      source: 'Puri',
      destination: 'Bhubaneswar',
      distance: 65,
    },
    {
      routeId: 'R245',
      source: 'Bhubaneswar',
      destination: 'Cuttack',
      distance: 25,
    },
    {
      routeId: 'R246',
      source: 'Cuttack',
      destination: 'Bhubaneswar',
      distance: 25,
    },
    { routeId: 'R247', source: 'Patna', destination: 'Ranchi', distance: 330 },
    { routeId: 'R248', source: 'Ranchi', destination: 'Patna', distance: 330 },
    {
      routeId: 'R249',
      source: 'Ranchi',
      destination: 'Jamshedpur',
      distance: 130,
    },
    {
      routeId: 'R250',
      source: 'Jamshedpur',
      destination: 'Ranchi',
      distance: 130,
    },
    {
      routeId: 'R251',
      source: 'Chennai',
      destination: 'Visakhapatnam',
      distance: 790,
      via: 'Tada, SriCity, Nayudupeta, Gudur, Nellore, Kavali, Ongole, Chilakaluripet, Guntur, Vijayawada, Eluru, Tadepalligudem, Tanuku, Rajahmundry, Samalkot, Kakinada, Annavaram, Tuni, Anakapalle',
    },
    {
      routeId: 'R252',
      source: 'Visakhapatnam',
      destination: 'Chennai',
      distance: 790,
      via: 'Anakapalle, Tuni, Annavaram, Kakinada, Samalkot, Rajahmundry, Tanuku, Tadepalligudem, Eluru, Vijayawada, Guntur, Chilakaluripet, Ongole, Kavali, Nellore, Gudur, Nayudupeta, SriCity, Tada',
    },
  ];

  create(data: Omit<Route, 'routeId'>): Route {
    const route: Route = { routeId: generateId('R'), ...data };
    this.routes.push(route);
    return route;
  }

  findAll(): Route[] {
    return this.routes;
  }

  findById(routeId: string): Route | undefined {
    return this.routes.find((r) => r.routeId === routeId);
  }

  findBySourceAndDestination(source: string, destination: string): Route[] {
    const norm = (c: string) => {
      const s = (c || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (
        [
          'visakhapatnam',
          'vishakapatnam',
          'vishakapatanam',
          'vizag',
          'vskp',
        ].includes(s)
      )
        return 'visakhapatnam';
      if (['chennai', 'madras'].includes(s)) return 'chennai';
      if (['bangalore', 'bengaluru'].includes(s)) return 'bangalore';
      if (['hyderabad', 'secunderabad'].includes(s)) return 'hyderabad';
      if (['vijayawada', 'bezawada'].includes(s)) return 'vijayawada';
      return s;
    };
    const sNorm = norm(source);
    const dNorm = norm(destination);

    return this.routes.filter(
      (r) =>
        (r.source.toLowerCase() === source.toLowerCase() ||
          norm(r.source) === sNorm) &&
        (r.destination.toLowerCase() === destination.toLowerCase() ||
          norm(r.destination) === dNorm),
    );
  }

  update(routeId: string, data: Partial<Route>): Route | undefined {
    const i = this.routes.findIndex((r) => r.routeId === routeId);
    if (i === -1) return undefined;
    this.routes[i] = { ...this.routes[i], ...data };
    return this.routes[i];
  }

  remove(routeId: string): boolean {
    const i = this.routes.findIndex((r) => r.routeId === routeId);
    if (i === -1) return false;
    this.routes.splice(i, 1);
    return true;
  }
}
