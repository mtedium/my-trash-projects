from django.urls import path
from Dashboard.views import *


urlpatterns = [
    path('index.html',index),
    path('abc.html',hello),
    path('search.html',search),
    path('dataSQL.html',dataSQL),
    path('dataORM.html',dataORM),
    path('graph.html',graph),
    path('graphApi',graphApi),
    path('pred.html',pred),
    path('record.html',record),
    path('screen.html',screen),
]


