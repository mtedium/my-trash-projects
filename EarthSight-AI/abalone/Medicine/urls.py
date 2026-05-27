from django.urls import path
from Medicine.views import *


urlpatterns = [
    path('indexJs.html',indexJs),
    path('indexVue.html',indexVue),
    path('indexAjax.html',indexAjax),
    path('indexElement.html',indexElement),
    path('cateApi',cateApi),
    path('videoApi',videoApi),
    path('videoApi2',videoApi),
    path('introApi',introApi),

    path('cateApi2',cateApi2),
]


