import {
  action,
  computed,
  isObservableArray,
  makeObservable,
  observable
} from "mobx";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import Result from "../../Core/Result";
import TerriaError from "../../Core/TerriaError";
import { SearchBarTraits } from "../../Traits/SearchProviders/SearchBarTraits";
import CommonStrata from "../Definition/CommonStrata";
import CreateModel from "../Definition/CreateModel";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import SearchProviderFactory from "./SearchProviderFactory";
import upsertSearchProviderFromJson from "./upsertSearchProviderFromJson";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import CatalogSearchProviderMixin from "../../ModelMixins/SearchProviders/CatalogSearchProviderMixin";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";

export class SearchBarModel extends CreateModel(SearchBarTraits) {
  private locationSearchProviders = observable.map<string, BaseModel>();

  @observable
  catalogSearchProvider: CatalogSearchProviderMixin.Instance | undefined;

  constructor(readonly terria: Terria) {
    super("search-bar-model", terria);

    makeObservable(this);
  }

  initializeSearchProviders() {
    const errors: TerriaError[] = [];

    const searchProviders = this.terria.configParameters.searchProviders;

    if (!isObservableArray(searchProviders)) {
      errors.push(
        new TerriaError({
          sender: SearchProviderFactory,
          title: "SearchProviders",
          message: { key: "searchProvider.noSearchProviders" }
        })
      );
    }
    searchProviders?.forEach((searchProvider) => {
      upsertSearchProviderFromJson(
        SearchProviderFactory,
        this.terria,
        CommonStrata.definition,
        searchProvider
      ).pushErrorTo(errors);
    });

    return new Result(
      undefined,
      TerriaError.combine(
        errors,
        "An error occurred while loading search providers"
      )
    );
  }

  /**
   * Add new SearchProvider to the list of SearchProviders.
   */
  @action
  addSearchProvider(model: BaseModel) {
    if (model.uniqueId === undefined) {
      throw new DeveloperError(
        "A SearchProvider without a `uniqueId` cannot be added."
      );
    }

    if (this.locationSearchProviders.has(model.uniqueId)) {
      throw new RuntimeError(
        "A SearchProvider with the specified ID already exists."
      );
    }

    if (!LocationSearchProviderMixin.isMixedInto(model)) {
      throw new RuntimeError(
        "SearchProvider must be a LocationSearchProvider."
      );
    }

    this.locationSearchProviders.set(model.uniqueId, model);
  }

  @computed
  get locationSearchProvidersArray() {
    return [...this.locationSearchProviders.entries()]
      .filter((entry) => {
        return LocationSearchProviderMixin.isMixedInto(entry[1]);
      })
      .map(function (entry) {
        return entry[1] as LocationSearchProviderMixin.Instance;
      });
  }
}
