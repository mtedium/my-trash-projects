from django.db import models

# Create your models here.
class Video(models.Model):
    cate1 = models.CharField(max_length=255, blank=True, null=True)
    cate2 = models.CharField(max_length=255, blank=True, null=True)
    video = models.CharField(max_length=255, blank=True, null=True)
    count = models.CharField(max_length=255, blank=True, null=True)
    time = models.CharField(max_length=255, blank=True, null=True)
    duration = models.CharField(max_length=255, blank=True, null=True)
    doctor = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    hospital = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    zan = models.CharField(max_length=255, blank=True, null=True)
    intro = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'video'
